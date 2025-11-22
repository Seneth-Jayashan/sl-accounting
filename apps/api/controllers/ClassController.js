// controllers/classController.js
import mongoose from "mongoose";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import moment from "moment-timezone";
import { createMeeting } from "../services/Zoom.js"; // <-- ensure this file exists

const getNextSessionMoment = (day, time, timezone, weekOffset = 0) => {
  const [hour, minute] = time.split(":").map(Number);
  let m = moment().tz(timezone).startOf("week").add(day, "days").set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (m.isBefore(moment().tz(timezone))) {
    m.add(1, "week");
  }

  if (weekOffset > 0) m.add(weekOffset, "week");

  return m;
};

export const createClass = async (req, res) => {
  try {
    const {
      timeSchedules = [],
      totalSessions = 4,
      sessionDurationMinutes = 120,
      ...rest
    } = req.body;

    // 1) Create Class document
    const newClass = new Class({
      ...rest,
      timeSchedules,
      totalSessions,
      sessionDurationMinutes,
    });
    const savedClass = await newClass.save();

    // 2) Build sessions
    const sessionPromises = [];
    let globalIndex = 1;

    // Fallback: if no timeSchedules provided, create sessions weekly starting from today same time (now)
    const schedules =
      Array.isArray(timeSchedules) && timeSchedules.length > 0
        ? timeSchedules
        : [
            {
              day: moment()
                .tz(process.env.DEFAULT_TIMEZONE || "UTC")
                .day(),
              startTime: moment()
                .tz(process.env.DEFAULT_TIMEZONE || "UTC")
                .format("HH:mm"),
              timezone: process.env.DEFAULT_TIMEZONE || "UTC",
            },
          ];

    // We'll create sessions sequentially (one-by-one) to avoid blasting Zoom API with parallel requests.
    // If you prefer faster creation and handle rate-limits, switch to Promise.all with throttling.
    const savedSessionIds = [];

    for (let i = 0; i < totalSessions; i++) {
      for (const sch of schedules) {
        const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
        const startMoment = getNextSessionMoment(sch.day, sch.startTime, tz, i);
        const endMoment = startMoment
          .clone()
          .add(sessionDurationMinutes, "minutes");

        // Prepare the session doc (Zoom fields will be filled after successful Zoom call)
        const sessionDoc = new Session({
          class: savedClass._id,
          index: globalIndex,
          startAt: startMoment.toDate(),
          endAt: endMoment.toDate(),
          timezone: tz,
          zoomMeetingId: null,
          zoomStartUrl: null,
          zoomJoinUrl: null,
          youtubeVideoId: null,
          recordingShared: false,
        });

        // Save the session *after* creating zoom meeting (so we can store zoom fields) - but we will save even if zoom fails.
        let zoomData = null;
        try {
          // createMeeting expects: { topic, start_time (ISO), duration, timezone, settings }
          // start_time should be ISO string — Zoom accepts timezone param separately as well.
          const startISO = startMoment.toISOString();
          zoomData = await createMeeting({
            topic: `${savedClass.name || "Class"} - Session ${globalIndex}`,
            start_time: startISO,
            duration: sessionDurationMinutes,
            timezone: tz,
            settings: {
              join_before_host: false,
              approval_type: 0,
              host_video: false,
              participant_video: false,
            },
          });

          // populate sessionDoc with returned Zoom info
          sessionDoc.zoomMeetingId =
            zoomData.id?.toString?.() ?? zoomData.id ?? null;
          sessionDoc.zoomStartUrl = zoomData.start_url ?? null; // host start URL
          sessionDoc.zoomJoinUrl = zoomData.join_url ?? null; // participant join URL
          // optionally store more meta (not required) - you can add a 'zoomMeta' mixed field in Session schema if desired
          // sessionDoc.zoomMeta = zoomData;
        } catch (zoomErr) {
          // Log and continue — session still created without Zoom data.
          console.error(
            `Zoom creation failed for class ${savedClass._id} session index ${globalIndex}:`,
            zoomErr?.message || zoomErr
          );
          // Optionally: if you want to abort entire class creation on Zoom failure, throw here.
          // throw zoomErr;
        }

        const savedSession = await sessionDoc.save();
        savedSessionIds.push(savedSession._id);

        globalIndex++;
      }
    }

    savedClass.sessions = savedSessionIds;
    await savedClass.save();

    const populated = await Class.findById(savedClass._id).populate({
      path: "sessions",
      options: { sort: { index: 1 } },
    });

    return res.status(201).json(populated);
  } catch (error) {
    console.error("createClass error:", error);
    return res.status(500).json({
      message: "Error creating class",
      error: error.message || error,
    });
  }
};

const recreateSessionsForClass = async (opts) => {
  const {
    classDoc,
    timeSchedules = [],
    totalSessions = 4,
    sessionDurationMinutes = 60,
    abortOnZoomFail = false,
  } = opts;

  // 1) load existing sessions
  const existingSessions = await Session.find({ class: classDoc._id });

  // 2) delete Zoom meetings for existing sessions (best-effort)
  for (const s of existingSessions) {
    if (s.zoomMeetingId) {
      try {
        await deleteMeeting(s.zoomMeetingId);
      } catch (err) {
        console.error(
          `Failed to delete zoom meeting ${s.zoomMeetingId} for session ${s._id}:`,
          err?.message || err
        );
        if (abortOnZoomFail) throw err;
        // else continue trying to remove remaining meetings & sessions
      }
    }
  }

  // 3) delete session documents
  if (existingSessions.length > 0) {
    await Session.deleteMany({ class: classDoc._id });
  }

  // 4) create new sessions + Zoom meetings sequentially
  const schedules =
    Array.isArray(timeSchedules) && timeSchedules.length > 0
      ? timeSchedules
      : [
          {
            day: moment()
              .tz(process.env.DEFAULT_TIMEZONE || "UTC")
              .day(),
            startTime: moment()
              .tz(process.env.DEFAULT_TIMEZONE || "UTC")
              .format("HH:mm"),
            timezone: process.env.DEFAULT_TIMEZONE || "UTC",
          },
        ];

  const savedSessionIds = [];
  let globalIndex = 1;

  for (let i = 0; i < totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      const startMoment = getNextSessionMoment(sch.day, sch.startTime, tz, i);
      const endMoment = startMoment
        .clone()
        .add(sessionDurationMinutes, "minutes");

      const sessionDoc = new Session({
        class: classDoc._id,
        index: globalIndex,
        startAt: startMoment.toDate(),
        endAt: endMoment.toDate(),
        timezone: tz,
        zoomMeetingId: null,
        zoomStartUrl: null,
        zoomJoinUrl: null,
        youtubeVideoId: null,
        recordingShared: false,
      });

      // create Zoom meeting (try-catch)
      try {
        const zoomData = await createMeeting({
          topic: `${classDoc.name || "Class"} - Session ${globalIndex}`,
          start_time: startMoment.toISOString(),
          duration: sessionDurationMinutes,
          timezone: tz,
          settings: {
            join_before_host: false,
            approval_type: 0,
            host_video: false,
            participant_video: false,
          },
        });

        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id) || null;
          sessionDoc.zoomStartUrl = zoomData.start_url ?? null;
          sessionDoc.zoomJoinUrl = zoomData.join_url ?? null;
        }
      } catch (zoomErr) {
        console.error(
          `Zoom creation failed for class ${classDoc._id} session index ${globalIndex}:`,
          zoomErr?.message || zoomErr
        );
        if (abortOnZoomFail) throw zoomErr;
        // else continue and store the session without zoom fields
      }

      const saved = await sessionDoc.save();
      savedSessionIds.push(saved._id);

      globalIndex++;
    }
  }

  return savedSessionIds;
};

/**
 * updateClass controller
 * - normal field updates apply
 * - if scheduling-related fields provided (timeSchedules / totalSessions / sessionDurationMinutes),
 *   existing sessions + meetings are deleted and new sessions + meetings are created.
 */
export const updateClass = async (req, res) => {
  const classId = req.params.id;
  const {
    timeSchedules,
    totalSessions,
    sessionDurationMinutes,
    // any other class fields can be in req.body via rest
    ...otherUpdates
  } = req.body;

  const abortOnZoomFail = false; // change to true if you want to abort when Zoom fails.

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1) find and update class basic fields
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Class not found" });
    }

    // apply non-scheduling updates
    Object.assign(classDoc, otherUpdates);

    // If scheduling-related fields are present in request, we will replace sessions.
    const willReplaceSchedule =
      typeof timeSchedules !== "undefined" ||
      typeof totalSessions !== "undefined" ||
      typeof sessionDurationMinutes !== "undefined";

    // Update class scheduling fields in the class document (so recreate uses them)
    if (typeof timeSchedules !== "undefined")
      classDoc.timeSchedules = timeSchedules;
    if (typeof totalSessions !== "undefined")
      classDoc.totalSessions = totalSessions;
    if (typeof sessionDurationMinutes !== "undefined")
      classDoc.sessionDurationMinutes = sessionDurationMinutes;

    // save class update (but not commit transaction yet)
    await classDoc.save({ session });

    // If we need to replace sessions, do that outside the DB transaction for Zoom calls,
    // but we can perform deletes/creates then re-save class.sessions.
    if (willReplaceSchedule) {
      // commit transaction before long-running external calls to avoid locks in DB for long time
      await session.commitTransaction(); // Commit before Zoom calls
      session.endSession();
      
      // Recreate sessions (this function deletes old sessions & meetings and creates new ones)
      const newSessionIds = await recreateSessionsForClass({
        classDoc,
        timeSchedules: classDoc.timeSchedules,
        totalSessions: classDoc.totalSessions,
        sessionDurationMinutes: classDoc.sessionDurationMinutes,
        abortOnZoomFail,
      });

      // After recreation, re-attach sessions to class doc
      classDoc.sessions = newSessionIds;
      await classDoc.save();

      const populated = await Class.findById(classDoc._id).populate({
        path: "sessions",
        options: { sort: { index: 1 } },
      });

      return res.status(200).json(populated);
    } else {
      // No schedule replacement: just commit the update
      await session.commitTransaction();
      session.endSession();

      const populated = await Class.findById(classDoc._id).populate({
        path: "sessions",
        options: { sort: { index: 1 } },
      });
      return res.status(200).json(populated);
    }
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (e) {}
    session.endSession();
    console.error("updateClass error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update class", error: err?.message || err });
  }
};

/**
 * deleteClass controller
 * - deletes all sessions for the class
 * - deletes Zoom meetings for each session (best-effort)
 * - finally deletes the class document
 */
export const deleteClass = async (req, res) => {
  const classId = req.params.id;

  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // find sessions
    const sessions = await Session.find({ class: classDoc._id });

    // delete Zoom meetings first (best-effort)
    for (const s of sessions) {
      if (s.zoomMeetingId) {
        try {
          await deleteMeeting(s.zoomMeetingId);
        } catch (err) {
          console.error(
            `Failed to delete Zoom meeting ${s.zoomMeetingId}:`,
            err?.message || err
          );
          // continue anyway (we want to clean DB even if zoom fails)
        }
      }
    }

    // delete sessions
    await Session.deleteMany({ class: classDoc._id });

    // delete class
    await Class.findByIdAndDelete(classDoc._id);

    return res
      .status(200)
      .json({
        message: "Class and its sessions (and meetings) deleted successfully",
      });
  } catch (err) {
    console.error("deleteClass error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete class", error: err?.message || err });
  }
};

export const getClassById = async (req, res) => {
  const classId = req.params.id;
  try {
    const classDoc = await Class.findById(classId).populate("sessions");
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    return res.status(200).json(classDoc);
  } catch (error) {
    console.error("getClassById error:", error);
    return res.status(500).json({
      message: "Error retrieving class",
      error: error.message || error,
    });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate("sessions");
    return res.status(200).json(classes);
  } catch (error) {
    console.error("getAllClasses error:", error);
    return res.status(500).json({
      message: "Error retrieving classes",
      error: error.message || error,
    });
  }
};

export const activateClass = async (req, res) => {
  const classId = req.params.id;
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    classDoc.isActive = true;
    await classDoc.save();
    return res.status(200).json({ message: "Class activated successfully" });
  } catch (error) {
    console.error("activateClass error:", error);
    return res.status(500).json({
      message: "Error activating class",
      error: error.message || error,
    });
  }
};

export const deactivateClass = async (req, res) => {
  const classId = req.params.id;
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }
    classDoc.isActive = false;
    await classDoc.save();
    return res.status(200).json({ message: "Class deactivated successfully" });
  } catch (error) {
    console.error("deactivateClass error:", error);
    return res.status(500).json({
      message: "Error deactivating class",
      error: error.message || error,
    });
  }
};
