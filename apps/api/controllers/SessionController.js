// controllers/sessionController.js
import mongoose from "mongoose";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import moment from "moment-timezone";
import { createMeeting, updateMeeting, deleteMeeting } from "../services/Zoom.js";

/**
 * Teacher adds a custom session to a class for a specific day/time.
 *
 * Expects:
 * - req.params.classId
 * - req.user => authenticated user object (must include _id)
 * - req.body:
 *    - startAt (ISO string) OR { date: "YYYY-MM-DD", time: "HH:mm", timezone: "Asia/Colombo" }
 *    - durationMinutes (Number, optional, default to class.sessionDurationMinutes or 60)
 *    - title (optional)
 *    - notes (optional)
 *    - skipZoom (optional boolean) — if true, don't create Zoom meeting
 *    - materials (optional array of URLs or file paths)
 */
export const createSessionForClass = async (req, res) => {
  const classId = req.params.classId;
  const userId = req.user && req.user._id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const {
    startAt,
    date,
    time,
    timezone,
    durationMinutes,
    title,
    notes,
    skipZoom = false,
    materials = []
  } = req.body;

  try {
    // 1) Load class
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // 2) Authorization: ensure req.user is the instructor for this class
    // NOTE: if your Class schema doesn't have 'instructor', adapt this check to your roles system.
    if (classDoc.instructor && classDoc.instructor.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the instructor can add sessions to this class" });
    }

    // 3) Determine startAt moment & timezone
    const tz = timezone || classDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
    let startMoment;

    if (startAt) {
      startMoment = moment.tz(startAt, tz);
      if (!startMoment.isValid()) {
        return res.status(400).json({ message: "Invalid startAt datetime" });
      }
    } else if (date && time) {
      const iso = `${date}T${time}:00`;
      startMoment = moment.tz(iso, tz);
      if (!startMoment.isValid()) {
        return res.status(400).json({ message: "Invalid date/time" });
      }
    } else {
      return res.status(400).json({ message: "Provide startAt (ISO) OR date + time" });
    }

    // 4) Duration & endAt
    const dur = Number(durationMinutes || classDoc.sessionDurationMinutes || 60);
    const endMoment = startMoment.clone().add(dur, "minutes");

    // 5) Determine next index for this class (unique constraint: { class, index })
    // We'll compute highest index and add 1
    const lastSession = await Session.findOne({ class: classDoc._id }).sort({ index: -1 }).limit(1).lean();
    const nextIndex = lastSession ? (lastSession.index + 1) : 1;

    // 6) Build session doc
    const sessionDoc = new Session({
      class: classDoc._id,
      index: nextIndex,
      startAt: startMoment.toDate(),
      endAt: endMoment.toDate(),
      timezone: tz,
      zoomMeetingId: null,
      zoomStartUrl: null,
      zoomJoinUrl: null,
      youtubeVideoId: null,
      recordingShared: false,
      notes: notes || null,
    });

    if (Array.isArray(materials) && materials.length) {
      // If your Session schema has a materials field, store them.
      // If not, you can add materials: [{ type: String }] to the sessionSchema.
      sessionDoc.materials = materials;
    }

    // 7) Create Zoom meeting (if not skipped)
    let zoomCreated = false;
    let zoomData = null;
    try {
      if (!skipZoom) {
        const zoomPayload = {
          topic: title || `${classDoc.name || "Class"} - Session ${nextIndex}`,
          start_time: startMoment.toISOString(),
          duration: dur,
          timezone: tz,
          settings: {
            join_before_host: false,
            approval_type: 0,
            host_video: false,
            participant_video: false,
          },
        };

        zoomData = await createMeeting(zoomPayload);

        if (zoomData) {
          sessionDoc.zoomMeetingId = zoomData.id?.toString?.() ?? zoomData.id ?? null;
          sessionDoc.zoomStartUrl = zoomData.start_url ?? null;
          sessionDoc.zoomJoinUrl = zoomData.join_url ?? null;
          zoomCreated = Boolean(sessionDoc.zoomMeetingId || sessionDoc.zoomJoinUrl);
        }
      }
    } catch (zoomErr) {
      // If zoom creation fails, decide behavior:
      // Here we continue and create session without zoom data, but log error.
      console.error("Zoom creation failed for custom session:", zoomErr?.message || zoomErr);
      // If you want to enforce Zoom for all sessions, return an error here instead.
      // return res.status(500).json({ message: "Zoom creation failed", error: zoomErr?.message || zoomErr });
    }

    // 8) Save session and attach to class. Use a transaction to ensure both are saved together.
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      const savedSession = await sessionDoc.save({ session: mongoSession });

      // Add to class sessions array (preserve ordering by index if you need)
      classDoc.sessions = classDoc.sessions || [];
      classDoc.sessions.push(savedSession._id);
      await classDoc.save({ session: mongoSession });

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      // 9) Return created session (optionally exclude zoomStartUrl if not instructor)
      const populated = await Session.findById(savedSession._id).lean();
      // If you want to avoid exposing host start url to students, sanitize before returning:
      // if (!req.user.isInstructor) delete populated.zoomStartUrl;

      return res.status(201).json({ message: "Session created", session: populated });
    } catch (dbErr) {
      // rollback: if Zoom was created, delete meeting to avoid orphaned Zoom meetings
      try {
        await mongoSession.abortTransaction();
      } catch (e) {}
      mongoSession.endSession();

      if (zoomCreated && sessionDoc.zoomMeetingId) {
        try {
          await deleteMeeting(sessionDoc.zoomMeetingId);
        } catch (delErr) {
          console.error("Failed to delete zoom meeting after DB rollback:", delErr?.message || delErr);
        }
      }

      console.error("DB error saving session:", dbErr);
      return res.status(500).json({ message: "Failed to save session", error: dbErr?.message || dbErr });
    }
  } catch (err) {
    console.error("createSessionForClass error:", err);
    return res.status(500).json({ message: "Failed to create session", error: err?.message || err });
  }
};


/**
 * Helper: sanitize session payload before sending to students
 * Removes sensitive host start url unless userIsInstructor is true.
 */
const sanitizeSessionForUser = (sessionDoc, { userIsInstructor = false } = {}) => {
  const s = sessionDoc.toObject ? sessionDoc.toObject() : sessionDoc;
  if (!userIsInstructor) {
    delete s.zoomStartUrl; // host start link is sensitive
  }
  return s;
};

/**
 * GET /sessions
 * Optional query params:
 * - classId
 * - from (ISO date)
 * - to (ISO date)
 * - isCancelled (true/false)
 * - page, limit, sort
 */
export const getAllSessions = async (req, res) => {
  try {
    const { classId, from, to, isCancelled, page = 1, limit = 50, sort = "startAt" } = req.query;

    const q = {};
    if (classId) q.class = classId;
    if (typeof isCancelled !== "undefined") q.isCancelled = (isCancelled === "true" || isCancelled === "1");
    if (from || to) q.startAt = {};
    if (from) q.startAt.$gte = new Date(from);
    if (to) q.startAt.$lte = new Date(to);

    const skip = (Math.max(0, Number(page) - 1)) * Number(limit);
    const sessions = await Session.find(q)
      .sort({ [sort]: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // If you want to hide sensitive fields for non-instructors, you can map here.
    const userId = req.user && req.user._id;
    const userIsInstructor = !!req.user && !!req.user.role && (req.user.role === "teacher" || req.user.role === "instructor" || req.user.isAdmin);

    const sanitized = sessions.map(s => {
      if (!userIsInstructor) {
        delete s.zoomStartUrl;
      }
      return s;
    });

    return res.status(200).json({ data: sanitized, count: sanitized.length });
  } catch (err) {
    console.error("getAllSessions error:", err);
    return res.status(500).json({ message: "Failed to fetch sessions", error: err?.message || err });
  }
};


/**
 * PUT /sessions/:id
 * Update a session. Allowed updates:
 * - startAt (ISO) or { date, time, timezone }
 * - durationMinutes
 * - notes, title, materials
 * - isCancelled (if true -> will optionally remove Zoom meeting)
 *
 * Behavior:
 * - If zoomMeetingId exists, tries to call zoomService.updateMeeting
 * - If updateMeeting fails with 404, falls back to delete+create
 * - If zoom update fails but abortOnZoomFail=true, the controller will stop and return error
 */
export const updateSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user && req.user._id;

  // Option flags in body
  const {
    startAt,
    date,
    time,
    timezone,
    durationMinutes,
    title,
    notes,
    materials,
    isCancelled,
    cancelReason,
    skipZoom = false,
    abortOnZoomFail = false,
  } = req.body;

  try {
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    // Authorization: allow instructor of class or admin
    if (classDoc.instructor && req.user && classDoc.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Only instructor or admin can update session" });
    }

    // Build new start moment if provided
    let newStartMoment = null;
    if (startAt) {
      newStartMoment = moment.tz(startAt, timezone || sessionDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC");
      if (!newStartMoment.isValid()) return res.status(400).json({ message: "Invalid startAt" });
    } else if (date && time) {
      const tz = timezone || sessionDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      newStartMoment = moment.tz(`${date}T${time}:00`, tz);
      if (!newStartMoment.isValid()) return res.status(400).json({ message: "Invalid date/time" });
    }

    const newDuration = durationMinutes ? Number(durationMinutes) : null;

    // Prepare zoom update payload if meeting exists
    let zoomPayload = null;
    if (!skipZoom && sessionDoc.zoomMeetingId) {
      // Only include fields Zoom expects for update
      zoomPayload = {};
      if (title) zoomPayload.topic = title;
      if (newStartMoment) zoomPayload.start_time = newStartMoment.toISOString();
      if (newDuration) zoomPayload.duration = newDuration;
      if (timezone || sessionDoc.timezone) zoomPayload.timezone = timezone || sessionDoc.timezone;
      // other settings can be applied if needed
    }

    // If there's a zoom meeting and we should update it, call zoomService.updateMeeting
    if (!skipZoom && sessionDoc.zoomMeetingId) {
      try {
        if (zoomPayload && Object.keys(zoomPayload).length > 0) {
          await updateMeeting(sessionDoc.zoomMeetingId, zoomPayload);
        }
      } catch (zoomErr) {
        // If Zoom 404 or meeting removed, fallback to recreate meeting
        const status = zoomErr?.response?.status;
        console.error("zoom update error:", zoomErr?.message || zoomErr);
        if (status === 404) {
          // try to recreate meeting (delete existing id locally first)
          try {
            // attempt delete (best-effort)
            await deleteMeeting(sessionDoc.zoomMeetingId).catch(() => {});
            sessionDoc.zoomMeetingId = null;
            sessionDoc.zoomJoinUrl = null;
            sessionDoc.zoomStartUrl = null;
            // continue to create below
          } catch (e) {
            console.error("failed to cleanup missing zoom meeting:", e);
          }
        } else if (abortOnZoomFail) {
          return res.status(500).json({ message: "Zoom update failed", error: zoomErr?.message || zoomErr });
        }
      }
    }

    // If meeting doesn't exist and skipZoom is false, create new meeting after adjusting fields
    let zoomCreated = false;
    let createdZoom = null;

    // Apply DB changes locally
    if (newStartMoment) {
      sessionDoc.startAt = newStartMoment.toDate();
      // recalc endAt if duration provided or keep existing duration
      const curDuration = newDuration || Math.round((new Date(sessionDoc.endAt).getTime() - new Date(sessionDoc.startAt).getTime()) / (1000 * 60));
      sessionDoc.endAt = newStartMoment.clone().add(curDuration, "minutes").toDate();
    } else if (newDuration) {
      // update endAt from existing startAt
      const curStart = moment(sessionDoc.startAt).tz(sessionDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC");
      sessionDoc.endAt = curStart.clone().add(newDuration, "minutes").toDate();
    }

    if (typeof title !== "undefined") sessionDoc.title = title;
    if (typeof notes !== "undefined") sessionDoc.notes = notes;
    if (typeof materials !== "undefined") sessionDoc.materials = materials;
    if (typeof timezone !== "undefined") sessionDoc.timezone = timezone;
    if (typeof isCancelled !== "undefined") {
      sessionDoc.isCancelled = !!isCancelled;
      if (isCancelled) {
        sessionDoc.cancelledAt = new Date();
        sessionDoc.cancellationReason = cancelReason || null;
      } else {
        sessionDoc.cancelledAt = null;
        sessionDoc.cancellationReason = null;
      }
    }

    // If meeting id is missing and skipZoom is false -> create meeting
    if (!skipZoom && !sessionDoc.zoomMeetingId) {
      try {
        const startISO = moment(sessionDoc.startAt).toISOString();
        const payload = {
          topic: sessionDoc.title || `${classDoc.name || "Class"} - Session ${sessionDoc.index}`,
          start_time: startISO,
          duration: Math.round((new Date(sessionDoc.endAt).getTime() - new Date(sessionDoc.startAt).getTime()) / (1000 * 60)),
          timezone: sessionDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC",
          settings: { join_before_host: false, approval_type: 0 },
        };
        createdZoom = await createMeeting(payload);
        if (createdZoom) {
          sessionDoc.zoomMeetingId = createdZoom.id?.toString?.() ?? createdZoom.id ?? null;
          sessionDoc.zoomJoinUrl = createdZoom.join_url ?? null;
          sessionDoc.zoomStartUrl = createdZoom.start_url ?? null;
          zoomCreated = true;
        }
      } catch (zoomErr) {
        console.error("Failed to create zoom meeting during session update:", zoomErr?.message || zoomErr);
        if (abortOnZoomFail) return res.status(500).json({ message: "Zoom create failed", error: zoomErr?.message || zoomErr });
        // else continue – session updated without zoom
      }
    }

    // Save session
    await sessionDoc.save();

    return res.status(200).json({ message: "Session updated", session: sanitizeSessionForUser(sessionDoc, { userIsInstructor: !!req.user && (req.user.isAdmin || (classDoc.instructor && classDoc.instructor.toString() === req.user._id.toString())) }) });
  } catch (err) {
    console.error("updateSession error:", err);
    return res.status(500).json({ message: "Failed to update session", error: err?.message || err });
  }
};


/**
 * DELETE /sessions/:id
 * Deletes a session and its Zoom meeting (if any) and removes it from its Class.sessions array.
 */
export const deleteSession = async (req, res) => {
  const sessionId = req.params.id;

  const mongoSession = await mongoose.startSession();
  try {
    mongoSession.startTransaction();

    const sessionDoc = await Session.findById(sessionId).session(mongoSession);
    if (!sessionDoc) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(404).json({ message: "Session not found" });
    }

    const classDoc = await Class.findById(sessionDoc.class).session(mongoSession);
    if (!classDoc) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(404).json({ message: "Parent class not found" });
    }

    // Authorization
    if (classDoc.instructor && req.user && classDoc.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(403).json({ message: "Only instructor or admin can delete session" });
    }

    // Delete Zoom meeting (best-effort)
    if (sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
      } catch (zoomErr) {
        // log and continue; we still want to delete DB objects
        console.error("Failed to delete Zoom meeting during session deletion:", zoomErr?.message || zoomErr);
      }
    }

    // Remove session reference from class.sessions
    classDoc.sessions = (classDoc.sessions || []).filter(sid => sid.toString() !== sessionDoc._id.toString());
    await classDoc.save({ session: mongoSession });

    // Delete the session document
    await Session.deleteOne({ _id: sessionDoc._id }).session(mongoSession);

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({ message: "Session deleted" });
  } catch (err) {
    try { await mongoSession.abortTransaction(); } catch (e) {}
    mongoSession.endSession();
    console.error("deleteSession error:", err);
    return res.status(500).json({ message: "Failed to delete session", error: err?.message || err });
  }
};


/**
 * POST /sessions/:id/cancel
 * Cancels the session (soft) and optionally removes the Zoom meeting so attendees cannot join.
 * Body: { deleteZoomMeeting: boolean, cancellationReason: string }
 */
export const cancelSession = async (req, res) => {
  const sessionId = req.params.id;
  const { deleteZoomMeeting = true, cancellationReason = null } = req.body;

  try {
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    // Authorization
    if (classDoc.instructor && req.user && classDoc.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Only instructor or admin can cancel session" });
    }

    // Delete zoom meeting if requested
    if (deleteZoomMeeting && sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
        // clear zoom fields
        sessionDoc.zoomMeetingId = null;
        sessionDoc.zoomJoinUrl = null;
        sessionDoc.zoomStartUrl = null;
      } catch (zoomErr) {
        console.error("Failed to delete Zoom meeting on cancel:", zoomErr?.message || zoomErr);
        // continue — still mark cancelled
      }
    }

    sessionDoc.isCancelled = true;
    sessionDoc.cancelledAt = new Date();
    sessionDoc.cancellationReason = cancellationReason || null;

    await sessionDoc.save();

    // Optionally: notify students about cancellation (hook into your notification system)

    return res.status(200).json({ message: "Session cancelled", session: sanitizeSessionForUser(sessionDoc, { userIsInstructor: !!req.user && (req.user.isAdmin || (classDoc.instructor && classDoc.instructor.toString() === req.user._id.toString())) }) });
  } catch (err) {
    console.error("cancelSession error:", err);
    return res.status(500).json({ message: "Failed to cancel session", error: err?.message || err });
  }
};