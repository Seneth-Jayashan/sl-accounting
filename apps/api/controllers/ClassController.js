// controllers/classController.js
import mongoose from "mongoose";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import moment from "moment-timezone";
import { createMeeting, deleteMeeting } from "../services/Zoom.js";

// Helper to calculate session times
const getNextSessionMoment = (startDateMoment, targetDayIndex, timeStr, timezone, weekOffset = 0) => {
  let m = startDateMoment.clone().tz(timezone);
  const [hour, minute] = timeStr.split(":").map(Number);
  m.set({ hour, minute, second: 0, millisecond: 0 });

  if (m.day() !== targetDayIndex) {
    m.day(targetDayIndex);
    if (m.isBefore(startDateMoment)) {
      m.add(1, 'week');
    }
  }

  if (weekOffset > 0) m.add(weekOffset, "week");
  return m;
};

export const createClass = async (req, res) => {
  try {
    const {
      timeSchedules = [],
      totalSessions = 1,
      sessionDurationMinutes = 120,
      firstSessionDate,
      ...rest
    } = req.body;

    const newClass = new Class({
      ...rest,
      firstSessionDate,
      timeSchedules,
      totalSessions,
      sessionDurationMinutes,
    });
    const savedClass = await newClass.save();

    let globalIndex = 1;
    const schedules =
      Array.isArray(timeSchedules) && timeSchedules.length > 0
        ? timeSchedules
        : [{ day: 0, startTime: "12:00", timezone: "UTC" }]; // Default fallback

    const anchorDate = firstSessionDate ? moment(firstSessionDate) : moment();
    const savedSessionIds = [];

    for (let i = 0; i < totalSessions; i++) {
      for (const sch of schedules) {
        const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
        const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, tz, i);
        const endMoment = startMoment.clone().add(sessionDurationMinutes, "minutes");

        const sessionDoc = new Session({
          class: savedClass._id,
          index: globalIndex,
          startAt: startMoment.toDate(), // Save to DB as UTC Date object (Correct for Mongo)
          endAt: endMoment.toDate(),
          timezone: tz,
          zoomMeetingId: null,
          zoomStartUrl: null,
          zoomJoinUrl: null,
          youtubeVideoId: null,
          recordingShared: false,
        });

        try {
          // --- FIX IS HERE ---
          // Send "Wall Clock" time to Zoom (e.g., "2025-11-29T18:00:00")
          // Zoom will combine this with the 'timezone' parameter.
          const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
          
          const zoomData = await createMeeting({
            topic: `${savedClass.name || "Class"} - Session ${globalIndex}`,
            start_time: zoomStartTime, // Sending 18:00
            duration: sessionDurationMinutes,
            timezone: tz,              // Sending Asia/Colombo
            settings: {
              join_before_host: false,
              approval_type: 0,
              host_video: false,
              participant_video: false,
            },
          });

          sessionDoc.zoomMeetingId = zoomData.id?.toString?.() ?? zoomData.id ?? null;
          sessionDoc.zoomStartUrl = zoomData.start_url ?? null;
          sessionDoc.zoomJoinUrl = zoomData.join_url ?? null;
        } catch (zoomErr) {
          console.error(`Zoom creation failed for class ${savedClass._id} session ${globalIndex}:`, zoomErr?.message);
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
    return res.status(500).json({ message: "Error creating class", error: error.message });
  }
};

// Also applying the fix to the update/recreate function
const recreateSessionsForClass = async (opts) => {
  const {
    classDoc,
    timeSchedules = [],
    totalSessions = 4,
    sessionDurationMinutes = 60,
    abortOnZoomFail = false,
  } = opts;

  // 1. Clean up old sessions
  const existingSessions = await Session.find({ class: classDoc._id });
  for (const s of existingSessions) {
    if (s.zoomMeetingId) {
      try { await deleteMeeting(s.zoomMeetingId); } catch (e) { console.error(e); }
    }
  }
  if (existingSessions.length > 0) await Session.deleteMany({ class: classDoc._id });

  // 2. Create new sessions
  const schedules = Array.isArray(timeSchedules) && timeSchedules.length > 0
      ? timeSchedules
      : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

  const anchorDate = classDoc.firstSessionDate ? moment(classDoc.firstSessionDate) : moment();
  const savedSessionIds = [];
  let globalIndex = 1;

  for (let i = 0; i < totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, tz, i);
      const endMoment = startMoment.clone().add(sessionDurationMinutes, "minutes");

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

      try {
        // --- FIX IS HERE AS WELL ---
        const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");

        const zoomData = await createMeeting({
          topic: `${classDoc.name || "Class"} - Session ${globalIndex}`,
          start_time: zoomStartTime,
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
        console.error(`Zoom creation failed for class ${classDoc._id}:`, zoomErr?.message);
        if (abortOnZoomFail) throw zoomErr;
      }

      const saved = await sessionDoc.save();
      savedSessionIds.push(saved._id);
      globalIndex++;
    }
  }
  return savedSessionIds;
};

// ... Rest of your controllers (updateClass, deleteClass etc.) remain the same
// just ensure updateClass calls recreateSessionsForClass which is now fixed.
export const updateClass = async (req, res) => {
  const classId = req.params.id;
  const { timeSchedules, totalSessions, sessionDurationMinutes, ...otherUpdates } = req.body;
  const abortOnZoomFail = false; 
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Class not found" });
    }

    Object.assign(classDoc, otherUpdates);

    const willReplaceSchedule =
      typeof timeSchedules !== "undefined" ||
      typeof totalSessions !== "undefined" ||
      typeof sessionDurationMinutes !== "undefined";

    if (typeof timeSchedules !== "undefined") classDoc.timeSchedules = timeSchedules;
    if (typeof totalSessions !== "undefined") classDoc.totalSessions = totalSessions;
    if (typeof sessionDurationMinutes !== "undefined") classDoc.sessionDurationMinutes = sessionDurationMinutes;

    await classDoc.save({ session });

    if (willReplaceSchedule) {
      await session.commitTransaction(); 
      session.endSession();
      
      const newSessionIds = await recreateSessionsForClass({
        classDoc,
        timeSchedules: classDoc.timeSchedules,
        totalSessions: classDoc.totalSessions,
        sessionDurationMinutes: classDoc.sessionDurationMinutes,
        abortOnZoomFail,
      });

      const freshClassDoc = await Class.findById(classId);
      freshClassDoc.sessions = newSessionIds;
      await freshClassDoc.save();

      const populated = await Class.findById(classId).populate({ path: "sessions", options: { sort: { index: 1 } } });
      return res.status(200).json(populated);
    } else {
      await session.commitTransaction();
      session.endSession();
      const populated = await Class.findById(classDoc._id).populate({ path: "sessions", options: { sort: { index: 1 } } });
      return res.status(200).json(populated);
    }
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    console.error("updateClass error:", err);
    return res.status(500).json({ message: "Failed to update class", error: err?.message || err });
  }
};

export const deleteClass = async (req, res) => {
    // ... use the same delete logic as provided in previous corrected response
    // ensuring deleteMeeting is imported.
    const classId = req.params.id;
    try {
        const classDoc = await Class.findById(classId);
        if (!classDoc) return res.status(404).json({ message: "Class not found" });
        const sessions = await Session.find({ class: classDoc._id });
        for (const s of sessions) {
            if (s.zoomMeetingId) {
                try { await deleteMeeting(s.zoomMeetingId); } catch (err) { console.error(err); }
            }
        }
        await Session.deleteMany({ class: classDoc._id });
        await Class.findByIdAndDelete(classDoc._id);
        return res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to delete", error: err.message });
    }
};

export const getClassById = async (req, res) => {
    // ... same as before
    try {
        const classDoc = await Class.findById(req.params.id).populate("sessions");
        if (!classDoc) return res.status(404).json({ message: "Class not found" });
        return res.status(200).json(classDoc);
    } catch (error) { return res.status(500).json(error); }
};

export const getAllClasses = async (req, res) => {
    // ... same as before
    try {
        const classes = await Class.find().populate("sessions");
        return res.status(200).json(classes);
    } catch (error) { return res.status(500).json(error); }
};

// ... Activate/Deactivate controllers remain same
export const activateClass = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) return res.status(404).json({ message: "Not found" });
        classDoc.isActive = true;
        await classDoc.save();
        return res.status(200).json({ message: "Activated" });
    } catch (error) { return res.status(500).json(error); }
};

export const deactivateClass = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) return res.status(404).json({ message: "Not found" });
        classDoc.isActive = false;
        await classDoc.save();
        return res.status(200).json({ message: "Deactivated" });
    } catch (error) { return res.status(500).json(error); }
};