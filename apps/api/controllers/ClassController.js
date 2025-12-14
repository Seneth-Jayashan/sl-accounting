import mongoose from "mongoose";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import moment from "moment-timezone";
import { createMeeting, deleteMeeting } from "../services/Zoom.js";

// --- Helper: Get file path safely ---
const getFilePath = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    // Returns e.g., "uploads/images/classes/cover-image-123.jpg"
    // .replace(/\\/g, "/") ensures forward slashes for consistent DB storage (Windows compatibility)
    return files[fieldName][0].path.replace(/\\/g, "/");
  }
  return null;
};

const getGalleryPaths = (files, fieldName) => {
  if (files && files[fieldName]) {
    return files[fieldName].map((file) => file.path.replace(/\\/g, "/"));
  }
  return [];
};

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
      ...rest // This contains text fields (name, description, etc.)
    } = req.body;

    // --- FIX START: Extract files from req.files ---
    const coverImage = getFilePath(req.files, 'coverImage');
    const images = getGalleryPaths(req.files, 'images');
    // --- FIX END ---

    const newClass = new Class({
      ...rest,
      firstSessionDate,
      timeSchedules,
      totalSessions,
      sessionDurationMinutes,
      coverImage, // Save the path to DB
      images: images.length > 0 ? images : undefined, // Save gallery if exists
    });

    const savedClass = await newClass.save();

    // ... (Rest of your Session/Zoom creation logic remains exactly the same) ...
    let globalIndex = 1;
    const schedules =
      Array.isArray(timeSchedules) && timeSchedules.length > 0
        ? timeSchedules
        : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

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
          startAt: startMoment.toDate(),
          endAt: endMoment.toDate(),
          timezone: tz,
          // ... defaults
        });

        try {
          const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
          const zoomData = await createMeeting({
            topic: `${savedClass.name || "Class"} - Session ${globalIndex}`,
            start_time: zoomStartTime,
            duration: sessionDurationMinutes,
            timezone: tz,
            settings: { join_before_host: false, approval_type: 0, host_video: false, participant_video: false },
          });

          sessionDoc.zoomMeetingId = zoomData.id?.toString?.() ?? zoomData.id ?? null;
          sessionDoc.zoomStartUrl = zoomData.start_url ?? null;
          sessionDoc.zoomJoinUrl = zoomData.join_url ?? null;
        } catch (zoomErr) {
          console.error(`Zoom creation failed:`, zoomErr?.message);
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
  const schedules = Array.isArray(timeSchedules) && timeSchedules.length > 0 ? timeSchedules : [{ day: 0, startTime: "12:00", timezone: "UTC" }];
    const anchorDate = classDoc.firstSessionDate ? moment(classDoc.firstSessionDate) : moment();
    const savedSessionIds = [];
    let globalIndex = 1;

    for (let i = 0; i < totalSessions; i++) {
        for (const sch of schedules) {
             const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
             const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, tz, i);
             const endMoment = startMoment.clone().add(sessionDurationMinutes, "minutes");

             const sessionDoc = new Session({
                 class: classDoc._id, index: globalIndex, startAt: startMoment.toDate(), endAt: endMoment.toDate(), timezone: tz
             });
             
             try {
                 const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
                 const zoomData = await createMeeting({
                    topic: `${classDoc.name || "Class"} - Session ${globalIndex}`,
                    start_time: zoomStartTime,
                    duration: sessionDurationMinutes,
                    timezone: tz,
                    settings: { join_before_host: false, approval_type: 0, host_video: false, participant_video: false },
                 });
                 if(zoomData) {
                    sessionDoc.zoomMeetingId = String(zoomData.id);
                    sessionDoc.zoomStartUrl = zoomData.start_url;
                    sessionDoc.zoomJoinUrl = zoomData.join_url;
                 }
             } catch(e) { console.error(e); if(abortOnZoomFail) throw e; }
             
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

    // --- FIX START: Check for new files ---
    if (req.files) {
      const newCover = getFilePath(req.files, 'coverImage');
      const newImages = getGalleryPaths(req.files, 'images');

      if (newCover) {
        // Optional: Delete old file using fs.unlinkSync(classDoc.coverImage) here if you want
        classDoc.coverImage = newCover;
      }
      if (newImages && newImages.length > 0) {
        // Depending on logic, you might want to push to array or replace
        // Here we replace the gallery if new images are uploaded
        classDoc.images = newImages; 
      }
    }
    // --- FIX END ---

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
        const classDoc = await Class.findById(req.params.classId).populate("sessions");
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

export const getAllPublicClasses = async (req, res) => {
  try {
    const classes = await Class.find({ 
        isActive: true, 
        isPublished: true, 
        // Ensure you have isDeleted in your schema, otherwise remove this line
        // isDeleted: false 
    })
    .populate("batch", "name") // Only get batch name
    .populate({
        path: "sessions",
        select: "index startAt endAt" // Only get public session info
    })
    .sort({ createdAt: -1 });

    return res.status(200).json(classes);
  } catch (error) {
    console.error("getAllPublicClasses error:", error);
    return res.status(500).json({ message: "Failed to fetch public classes" });
  }
};

// ---------------------------------------------------------
// PUBLIC: Get Single Class (Hide Zoom Links)
// ---------------------------------------------------------
export const getPublicClass = async (req, res) => {
  try {
    const id = req.params.id;
    
    // 1. Find the class with filters
    const classDoc = await Class.findOne({ 
        _id: id, 
        isActive: true, 
        isPublished: true 
        // isDeleted: false 
    })
    .populate("batch", "name")
    .populate({
        path: "sessions",
        // SECURITY: Exclude sensitive Zoom links for public users
        select: "-zoomStartUrl -zoomJoinUrl -zoomMeetingId -youtubeVideoId" 
    });

    if (!classDoc) {
        return res.status(404).json({ message: "Class not found" });
    }

    return res.status(200).json(classDoc);
  } catch (error) {
    console.error("getPublicClass error:", error);
    return res.status(500).json({ message: "Error fetching class details", error: error.message });
  }
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