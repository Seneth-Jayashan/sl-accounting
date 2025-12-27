import mongoose from "mongoose";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import Batch from "../models/Batch.js";
import { createMeeting, deleteMeeting } from "../services/Zoom.js";

// --- HELPERS ---

const getFilePath = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    // Normalizes paths for Windows/Linux compatibility
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

// Logic to calculate exact session timestamps based on day of week
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

// --- CONTROLLERS ---

/**
 * CREATE CLASS (Atomic Transaction)
 */
export const createClass = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      timeSchedules = [],
      totalSessions = 1,
      sessionDurationMinutes = 120,
      firstSessionDate,
      ...rest
    } = req.body;

    // 1. Handle Files
    const coverImage = getFilePath(req.files, 'coverImage');
    const images = getGalleryPaths(req.files, 'images');

    // 2. Create Class Document
    const newClass = new Class({
      ...rest,
      firstSessionDate,
      timeSchedules,
      totalSessions,
      sessionDurationMinutes,
      coverImage, 
      images: images.length > 0 ? images : undefined,
    });

    const savedClass = await newClass.save({ session });

    // 3. Generate Sessions
    const schedules = Array.isArray(timeSchedules) && timeSchedules.length > 0
        ? timeSchedules
        : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

    const anchorDate = firstSessionDate ? moment(firstSessionDate) : moment();
    const savedSessionIds = [];
    let globalIndex = 1;

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
        });

        // 4. Create Zoom Meeting (Best Effort)
        try {
          const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
          const zoomData = await createMeeting({
            topic: `${savedClass.name} - Session ${globalIndex}`,
            start_time: zoomStartTime,
            duration: sessionDurationMinutes,
            timezone: tz,
            settings: { join_before_host: false, approval_type: 0, host_video: false, participant_video: false },
          });

          if (zoomData) {
              sessionDoc.zoomMeetingId = String(zoomData.id);
              sessionDoc.zoomStartUrl = zoomData.start_url;
              sessionDoc.zoomJoinUrl = zoomData.join_url;
          }
        } catch (zoomErr) {
          console.error(`Zoom creation warning (Session ${globalIndex}):`, zoomErr.message);
        }

        const savedSession = await sessionDoc.save({ session });
        savedSessionIds.push(savedSession._id);
        globalIndex++;
      }
    }

    // 5. Link Sessions
    savedClass.sessions = savedSessionIds;
    await savedClass.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 6. Return Data
    const populated = await Class.findById(savedClass._id).populate({
      path: "sessions",
      options: { sort: { index: 1 } },
    });

    const batchToUpdate = await Batch.findById(rest.batch);
    if (batchToUpdate) {
      batchToUpdate.classes.push(savedClass._id);
      await batchToUpdate.save();
    }

    return res.status(201).json(populated);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createClass error:", error);
    return res.status(500).json({ message: "Error creating class", error: error.message });
  }
};

/**
 * HELPER: Recreate Sessions (Used in Update)
 */
const recreateSessionsForClass = async (opts) => {
  const {
    classDoc,
    timeSchedules = [],
    totalSessions = 4,
    sessionDurationMinutes = 60,
    abortOnZoomFail = false,
  } = opts;

  // Cleanup Old
  const existingSessions = await Session.find({ class: classDoc._id });
  for (const s of existingSessions) {
    if (s.zoomMeetingId) {
      try { await deleteMeeting(s.zoomMeetingId); } catch (e) { console.error("Zoom delete error:", e.message); }
    }
  }
  if (existingSessions.length > 0) await Session.deleteMany({ class: classDoc._id });

  // Create New
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
          topic: `${classDoc.name} - Session ${globalIndex}`,
          start_time: zoomStartTime,
          duration: sessionDurationMinutes,
          timezone: tz,
        });
        if(zoomData) {
           sessionDoc.zoomMeetingId = String(zoomData.id);
           sessionDoc.zoomStartUrl = zoomData.start_url;
           sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch(e) { 
          console.error("Zoom create error during update:", e.message); 
          if(abortOnZoomFail) throw e; 
      }
      
      const saved = await sessionDoc.save();
      savedSessionIds.push(saved._id);
      globalIndex++;
    }
  }
  return savedSessionIds;
};

/**
 * UPDATE CLASS
 */
export const updateClass = async (req, res) => {
  const { classId } = req.params;
  const { timeSchedules, totalSessions, sessionDurationMinutes, ...otherUpdates } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const classDoc = await Class.findById(classId).session(session);
    
    if (!classDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Class not found" });
    }

    if (req.files) {
      const newCover = getFilePath(req.files, 'coverImage');
      const newImages = getGalleryPaths(req.files, 'images');
      if (newCover) classDoc.coverImage = newCover;
      if (newImages && newImages.length > 0) classDoc.images = newImages; 
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

    await session.commitTransaction();
    session.endSession();

    if (willReplaceSchedule) {
      // Re-create sessions logic (Non-transactional to avoid long locks with external API)
      const newSessionIds = await recreateSessionsForClass({
        classDoc,
        timeSchedules: classDoc.timeSchedules,
        totalSessions: classDoc.totalSessions,
        sessionDurationMinutes: classDoc.sessionDurationMinutes,
      });

      const freshClassDoc = await Class.findById(classId);
      freshClassDoc.sessions = newSessionIds;
      await freshClassDoc.save();
    }

    const populated = await Class.findById(classId).populate({ path: "sessions", options: { sort: { index: 1 } } });
    return res.status(200).json(populated);

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Failed to update class", error: err.message });
  }
};

/**
 * DELETE CLASS
 */
export const deleteClass = async (req, res) => {
  const { classId } = req.params;
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // 1. Delete External Zoom Meetings
    const sessions = await Session.find({ class: classDoc._id });
    for (const s of sessions) {
        if (s.zoomMeetingId) {
            try { await deleteMeeting(s.zoomMeetingId); } catch (err) { console.warn("Zoom cleanup warning:", err.message); }
        }
    }

    // 2. Delete DB Records
    await Session.deleteMany({ class: classDoc._id });
    await Class.findByIdAndDelete(classDoc._id);

    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete", error: err.message });
  }
};

/**
 * GET CLASS BY ID (Protected)
 */
export const getClassById = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const populateSelect = isAdmin ? "" : "-zoomStartUrl -zoomMeetingId"; 

    const classDoc = await Class.findById(req.params.classId)
        .populate({
            path: "sessions",
            select: populateSelect,
            options: { sort: { index: 1 } }
        })
        .populate("batch", "name"); 

    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    
    return res.status(200).json(classDoc);
  } catch (error) { return res.status(500).json({ message: "Error fetching class", error: error.message }); }
};

/**
 * GET ALL CLASSES (Protected / Admin view)
 */
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
        .populate("batch", "name")
        .sort({ createdAt: -1 });
    return res.status(200).json(classes);
  } catch (error) { return res.status(500).json(error); }
};

/**
 * GET PUBLIC CLASSES
 */
export const getAllPublicClasses = async (req, res) => {
  try {
    const classes = await Class.find({ 
        isActive: true, 
        isPublished: true, 
    })
    .select("-sessions") 
    .populate("batch", "name")
    .sort({ createdAt: -1 });

    return res.status(200).json(classes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch public classes" });
  }
};

/**
 * GET SINGLE PUBLIC CLASS
 */
export const getPublicClass = async (req, res) => {
  try {
    const classDoc = await Class.findOne({ 
        _id: req.params.id, 
        isActive: true, 
        isPublished: true 
    })
    .populate("batch", "name")
    .populate({
        path: "sessions",
        select: "index startAt endAt title durationMinutes timezone", 
    });

    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    return res.status(200).json(classDoc);
  } catch (error) {
    console.log("getPublicClass error:", error);
    return res.status(500).json({ message: "Error fetching class details" });
  }
};

// --- STATUS CONTROLLERS ---
// Updated to use classId matching the Route
export const activateClass = async (req, res) => {
    try {
        const { classId } = req.params; // Changed from 'id'
        const classDoc = await Class.findById(classId);
        if (!classDoc) return res.status(404).json({ message: "Not found" });
        
        classDoc.isActive = true;
        await classDoc.save();
        return res.status(200).json({ message: "Activated" });
    } catch (error) { return res.status(500).json(error); }
};

export const deactivateClass = async (req, res) => {
    try {
        const { classId } = req.params; // Changed from 'id'
        const classDoc = await Class.findById(classId);
        if (!classDoc) return res.status(404).json({ message: "Not found" });
        
        classDoc.isActive = false;
        await classDoc.save();
        return res.status(200).json({ message: "Deactivated" });
    } catch (error) { return res.status(500).json(error); }
};