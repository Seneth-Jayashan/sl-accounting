import mongoose from "mongoose";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import { createMeeting, updateMeeting, deleteMeeting } from "../services/Zoom.js";
import Enrollment from "../models/Enrollment.js";

// --- HELPER: Field Projection ---
const getSafeSessionProjection = (user) => {
  const isAdmin = user.role === 'admin';
  // Students should NEVER see the Zoom Host URL (start_url)
  return isAdmin ? "" : "-zoomStartUrl -zoomMeetingId"; 
};

/**
 * CREATE SESSION (Atomic Transaction)
 * Role: Admin Only (Enforced by Middleware)
 */
export const createSessionForClass = async (req, res) => {
  const { classId } = req.params;
  const {
    startAt, // Expect ISO String: "2024-01-01T10:00:00.000Z"
    durationMinutes = 60,
    title,
    notes,
    skipZoom = false,
    materials = []
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) throw new Error("Class not found");

    // 1. Time Validation
    const tz = req.body.timezone || classDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
    const startMoment = moment.tz(startAt, tz);
    if (!startMoment.isValid()) throw new Error("Invalid startAt date format.");

    const endMoment = startMoment.clone().add(durationMinutes, "minutes");

    // 2. Determine Index
    const lastSession = await Session.findOne({ class: classId }).sort({ index: -1 }).session(session);
    const nextIndex = lastSession ? (lastSession.index + 1) : 1;

    // 3. Create Session Doc
    const sessionDoc = new Session({
      class: classId,
      index: nextIndex,
      startAt: startMoment.toDate(),
      endAt: endMoment.toDate(),
      timezone: tz,
      title: title || `Session ${nextIndex}`,
      notes,
      materials
    });

    // 4. Create Zoom (External API)
    if (!skipZoom) {
      try {
        const zoomData = await createMeeting({
          topic: sessionDoc.title,
          start_time: startMoment.toISOString(),
          duration: Number(durationMinutes),
          timezone: tz,
          settings: { 
            host_video: true, 
            participant_video: false, 
            auto_recording: "cloud" 
          },
        });

        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id);
          sessionDoc.zoomStartUrl = zoomData.start_url; // Host Link
          sessionDoc.zoomJoinUrl = zoomData.join_url;   // Student Link
        }
      } catch (zoomErr) {
        console.error("Zoom create failed:", zoomErr.message);
        // We continue creation without Zoom, but log the error.
      }
    }

    // 5. Save DB
    const savedSession = await sessionDoc.save({ session });
    
    classDoc.sessions.push(savedSession._id);
    await classDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ success: true, session: savedSession });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL SESSIONS
 */
export const getAllSessions = async (req, res) => {
  try {
    const { classId, from, to, isCancelled, page = 1, limit = 50 } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (isCancelled !== undefined) query.isCancelled = isCancelled === 'true';
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }

    // Security: Filter fields based on role
    const projection = getSafeSessionProjection(req.user);

    const sessions = await Session.find(query)
      .select(projection)
      .sort({ startAt: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch sessions", error: err.message });
  }
};

/**
 * GET SESSION BY ID
 */
export const getSessionById = async (req, res) => {
  try {
    const projection = getSafeSessionProjection(req.user);
    const session = await Session.findById(req.params.id).select(projection);
    
    if (!session) return res.status(404).json({ message: "Session not found" });
    
    return res.status(200).json({ session });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE SESSION
 * Role: Admin Only
 */
export const updateSession = async (req, res) => {
  const { 
    startAt, durationMinutes, title, notes, materials, skipZoom 
  } = req.body;

  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    // 1. Update Basic Fields
    if (title) sessionDoc.title = title;
    if (notes) sessionDoc.notes = notes;
    if (materials) sessionDoc.materials = materials;

    // 2. Handle Time Updates & Zoom Sync
    let timeChanged = false;
    if (startAt) {
      const startMoment = moment(startAt); // Assume UTC/ISO from frontend
      if (startMoment.isValid()) {
        sessionDoc.startAt = startMoment.toDate();
        // Recalculate endAt based on existing duration or new duration
        const dur = durationMinutes ? Number(durationMinutes) : moment(sessionDoc.endAt).diff(moment(sessionDoc.startAt), 'minutes');
        sessionDoc.endAt = startMoment.clone().add(dur, 'minutes').toDate();
        timeChanged = true;
      }
    }

    // 3. Zoom Update Logic
    if (!skipZoom && sessionDoc.zoomMeetingId) {
      try {
        const updatePayload = {};
        if (title) updatePayload.topic = title;
        if (timeChanged) updatePayload.start_time = moment(sessionDoc.startAt).toISOString();
        if (durationMinutes) updatePayload.duration = Number(durationMinutes);
        
        if (Object.keys(updatePayload).length > 0) {
           await updateMeeting(sessionDoc.zoomMeetingId, updatePayload);
        }
      } catch (zoomErr) {
        console.error("Zoom update warning:", zoomErr.message);
      }
    }

    await sessionDoc.save();
    return res.status(200).json({ session: sessionDoc });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE SESSION
 * Role: Admin Only
 */
export const deleteSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sessionDoc = await Session.findById(req.params.id).session(session);
    if (!sessionDoc) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Session not found" });
    }

    const classDoc = await Class.findById(sessionDoc.class).session(session);
    if (classDoc) {
        // Unlink from Class
        classDoc.sessions = classDoc.sessions.filter(s => s.toString() !== sessionDoc._id.toString());
        await classDoc.save({ session });
    }

    // Delete Zoom
    if (sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
      } catch (e) { 
        console.warn("Zoom delete skipped:", e.message); 
      }
    }

    // Delete Session
    await Session.deleteOne({ _id: sessionDoc._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Session deleted" });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

/**
 * CANCEL SESSION
 * Role: Admin Only
 */
export const cancelSession = async (req, res) => {
  const { deleteZoomMeeting = true, cancellationReason } = req.body;

  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    // Handle Zoom
    if (deleteZoomMeeting && sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
        sessionDoc.zoomMeetingId = null;
        sessionDoc.zoomStartUrl = null;
        sessionDoc.zoomJoinUrl = null;
      } catch (e) { console.warn("Zoom delete warning:", e.message); }
    }

    sessionDoc.isCancelled = true;
    sessionDoc.cancelledAt = new Date();
    sessionDoc.cancellationReason = cancellationReason;

    await sessionDoc.save();

    return res.status(200).json({ message: "Session cancelled", session: sessionDoc });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// In your Backend API (e.g., SessionController.js)

export const getSessionsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;

    // 1. Fetch Enrollment
    const enrollment = await Enrollment.findOne({ class: classId, student: userId });
    
    // 2. Fetch Sessions
    const sessions = await Session.find({ class: classId }).sort({ startAt: 1 }).lean(); // .lean() converts to plain JS object so we can modify

    // 3. SECURITY FILTER
    const secureSessions = sessions.map(session => {
        let isLocked = false;
        
        if (!enrollment) {
            isLocked = true;
        } else {
            const sessionDate = new Date(session.startAt);
            const joinDate = new Date(enrollment.createdAt);
            
            // Restriction A: Join Date
            if (sessionDate < joinDate) isLocked = true;
            
            // Restriction B: Payment (Access End Date)
            if (enrollment.accessEndDate && sessionDate > enrollment.accessEndDate) {
                isLocked = true;
            }
        }

        // IF LOCKED: Remove the video ID from the response
        if (isLocked) {
            return {
                ...session,
                youtubeVideoId: null,      // ERASE THIS
                recordingUrl: null,        // ERASE THIS
                zoomJoinUrl: null,         // ERASE THIS
                isLocked: true             // Flag for frontend
            };
        }
        
        return session;
    });

    return res.json(secureSessions);

  } catch (error) {
    return res.status(500).json({ message: "Error fetching sessions" });
  }
};