import mongoose from "mongoose";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import Batch from "../models/Batch.js";
import { createMeeting, deleteMeeting } from "../services/Zoom.js";

// --- HELPERS ---

const getFilePath = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
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

const getNextSessionMoment = (
  startDateMoment,
  targetDayIndex,
  timeStr,
  timezone,
  weekOffset = 0
) => {
  let m = startDateMoment.clone().tz(timezone);
  const [hour, minute] = timeStr.split(":").map(Number);
  m.set({ hour, minute, second: 0, millisecond: 0 });

  if (m.day() !== targetDayIndex) {
    m.day(targetDayIndex);
    if (m.isBefore(startDateMoment)) {
      m.add(1, "week");
    }
  }

  if (weekOffset > 0) m.add(weekOffset, "week");
  return m;
};

/**
 * INTERNAL HELPER: Creates one Class Document + Associated Sessions
 */
const createSingleClassInternal = async (dbSession, data, filePaths) => {
  // 1. Prepare configuration object for Mongoose
  // We intentionally merge everything here to ensure 'type' is respected
  const classConfig = {
    ...data,
    coverImage: filePaths.coverImage,
    images: filePaths.images,
    // Ensure defaults if missing
    timeSchedules: data.timeSchedules || [],
    totalSessions: data.totalSessions || 1,
    sessionDurationMinutes: data.sessionDurationMinutes || 120,
  };

  // 2. Create Class Doc
  const newClass = new Class(classConfig);
  const savedClass = await newClass.save({ session: dbSession });

  // 3. Generate Sessions
  const schedules =
    Array.isArray(classConfig.timeSchedules) &&
    classConfig.timeSchedules.length > 0
      ? classConfig.timeSchedules
      : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

  const anchorDate = classConfig.firstSessionDate
    ? moment(classConfig.firstSessionDate)
    : moment();
  const savedSessionIds = [];
  let globalIndex = 1;

  for (let i = 0; i < classConfig.totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      const startMoment = getNextSessionMoment(
        anchorDate,
        sch.day,
        sch.startTime,
        tz,
        i
      );
      const endMoment = startMoment
        .clone()
        .add(classConfig.sessionDurationMinutes, "minutes");

      const sessionDoc = new Session({
        class: savedClass._id,
        index: globalIndex,
        startAt: startMoment.toDate(),
        endAt: endMoment.toDate(),
        timezone: tz,
      });

      try {
        const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
        const topic = `${savedClass.name} - Session ${globalIndex}`;

        const zoomData = await createMeeting({
          topic: topic,
          start_time: zoomStartTime,
          duration: classConfig.sessionDurationMinutes,
          timezone: tz,
          settings: {
            join_before_host: false,
            approval_type: 2,
            host_video: false,
            participant_video: false,
            auto_recording: "cloud",
          },
        });

        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id);
          sessionDoc.zoomStartUrl = zoomData.start_url;
          sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch (zoomErr) {
        console.error(`Zoom creation warning:`, zoomErr.message);
      }

      const savedSession = await sessionDoc.save({ session: dbSession });
      savedSessionIds.push(savedSession._id);
      globalIndex++;
    }
  }

  savedClass.sessions = savedSessionIds;
  await savedClass.save({ session: dbSession });

  if (classConfig.batch) {
    const batchToUpdate = await Batch.findById(classConfig.batch).session(
      dbSession
    );
    if (batchToUpdate) {
      batchToUpdate.classes.push(savedClass._id);
      await batchToUpdate.save({ session: dbSession });
    }
  }

  return savedClass;
};

// --- CONTROLLERS ---

export const createClass = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      autoCreateVariants,
      type,
      revisionDay,
      revisionStartTime,
      revisionEndTime,
      revisionPrice,
      paperDay,
      paperStartTime,
      paperEndTime,
      paperPrice,
      ...rest
    } = req.body;

    // FIX: FormData sends "true"/"false" strings
    const shouldCreateVariants = String(autoCreateVariants) === "true";

    // 1. Files
    const filePaths = {
      coverImage: getFilePath(req.files, "coverImage"),
      images: getGalleryPaths(req.files, "images") || [],
    };
    if (filePaths.images.length === 0) delete filePaths.images;

    // 2. Prepare Primary Data (THEORY)
    // Explicitly set type to ensure it is passed correctly
    const primaryData = {
      ...rest,
      type: type || "theory",
    };

    // 3. Create PRIMARY Class
    const primaryClass = await createSingleClassInternal(
      session,
      primaryData,
      filePaths
    );

    // 4. Create Variants
    if (shouldCreateVariants && primaryData.type === "theory") {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo";

      let revisionId = null;
      let paperId = null;

      // --- A. REVISION CLASS ---
      if (revisionDay !== undefined && revisionStartTime && revisionEndTime) {
        const revisionSchedule = [
          {
            day: Number(revisionDay),
            startTime: revisionStartTime,
            endTime: revisionEndTime,
            timezone: timezone,
          },
        ];

        // Construct FRESH object to avoid reference issues
        const revisionData = {
          name: `${primaryData.name} - Revision`,
          description: primaryData.description,
          price: revisionPrice ? Number(revisionPrice) : primaryData.price,
          batch: primaryData.batch,
          level: primaryData.level,
          recurrence: primaryData.recurrence,
          firstSessionDate: primaryData.firstSessionDate,
          totalSessions: primaryData.totalSessions,
          tags: primaryData.tags,
          isPublished: primaryData.isPublished,

          // CRITICAL: Explicitly set Type and Link
          type: "revision",
          parentTheoryClass: primaryClass._id,

          timeSchedules: revisionSchedule,
          sessionDurationMinutes: moment(revisionEndTime, "HH:mm").diff(
            moment(revisionStartTime, "HH:mm"),
            "minutes"
          ),
        };

        console.log("Creating revision class with data:", revisionData);

        const revClass = await createSingleClassInternal(
          session,
          revisionData,
          filePaths
        );
        revisionId = revClass._id;

        console.log("Created revision class with ID:", revisionId);
        console.log("Revision class data:", revClass);
      }

      console.log("Paper class data:", {      
        paperDay,
        paperStartTime,
        paperEndTime,
      });

      // --- B. PAPER CLASS ---
      if (paperDay !== undefined && paperStartTime && paperEndTime) {
        const paperSchedule = [
          {
            day: Number(paperDay),
            startTime: paperStartTime,
            endTime: paperEndTime,
            timezone: timezone,
          },
        ];

        // Construct FRESH object
        const paperData = {
          name: `${primaryData.name} - Paper`,
          description: primaryData.description,
          price: paperPrice ? Number(paperPrice) : primaryData.price,
          batch: primaryData.batch,
          level: primaryData.level,
          recurrence: primaryData.recurrence,
          firstSessionDate: primaryData.firstSessionDate,
          totalSessions: primaryData.totalSessions,
          tags: primaryData.tags,
          isPublished: primaryData.isPublished,

          // CRITICAL: Explicitly set Type and Link
          type: "paper",
          parentTheoryClass: primaryClass._id,

          timeSchedules: paperSchedule,
          sessionDurationMinutes: moment(paperEndTime, "HH:mm").diff(
            moment(paperStartTime, "HH:mm"),
            "minutes"
          ),
        };

        console.log("Creating paper class with data:", paperData);

        const papClass = await createSingleClassInternal(
          session,
          paperData,
          filePaths
        );
        paperId = papClass._id;

        console.log("Created paper class with ID:", paperId);
        console.log("Paper class data:", papClass);
      }

      // --- C. Update Primary Class Links ---
      if (revisionId || paperId) {
        if (revisionId) primaryClass.linkedRevisionClass = revisionId;
        if (paperId) primaryClass.linkedPaperClass = paperId;
        await primaryClass.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: shouldCreateVariants
        ? "Theory, Revision, and Paper classes created successfully"
        : "Class created successfully",
      class: primaryClass,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createClass error:", error);
    return res
      .status(500)
      .json({ message: "Error creating class", error: error.message });
  }
};

// ... (Rest of the file: recreateSessionsForClass, updateClass, deleteClass, etc.) ...
const recreateSessionsForClass = async (opts) => {
  const {
    classDoc,
    timeSchedules = [],
    totalSessions = 4,
    sessionDurationMinutes = 60,
    abortOnZoomFail = false,
  } = opts;
  const existingSessions = await Session.find({ class: classDoc._id });
  for (const s of existingSessions) {
    if (s.zoomMeetingId) {
      try {
        await deleteMeeting(s.zoomMeetingId);
      } catch (e) {
        console.error("Zoom delete error:", e.message);
      }
    }
  }
  if (existingSessions.length > 0)
    await Session.deleteMany({ class: classDoc._id });
  const schedules =
    Array.isArray(timeSchedules) && timeSchedules.length > 0
      ? timeSchedules
      : [{ day: 0, startTime: "12:00", timezone: "UTC" }];
  const anchorDate = classDoc.firstSessionDate
    ? moment(classDoc.firstSessionDate)
    : moment();
  const savedSessionIds = [];
  let globalIndex = 1;
  for (let i = 0; i < totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      const startMoment = getNextSessionMoment(
        anchorDate,
        sch.day,
        sch.startTime,
        tz,
        i
      );
      const endMoment = startMoment
        .clone()
        .add(sessionDurationMinutes, "minutes");
      const sessionDoc = new Session({
        class: classDoc._id,
        index: globalIndex,
        startAt: startMoment.toDate(),
        endAt: endMoment.toDate(),
        timezone: tz,
      });
      try {
        const zoomStartTime = startMoment.format("YYYY-MM-DDTHH:mm:ss");
        const zoomData = await createMeeting({
          topic: `${classDoc.name} - Session ${globalIndex}`,
          start_time: zoomStartTime,
          duration: sessionDurationMinutes,
          timezone: tz,
        });
        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id);
          sessionDoc.zoomStartUrl = zoomData.start_url;
          sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch (e) {
        console.error("Zoom create error during update:", e.message);
        if (abortOnZoomFail) throw e;
      }
      const saved = await sessionDoc.save();
      savedSessionIds.push(saved._id);
      globalIndex++;
    }
  }
  return savedSessionIds;
};

export const updateClass = async (req, res) => {
  const { classId } = req.params;
  console.log("UpdateClass called with ID:", classId);
  console.log("Request body:", req.body);
  const { 
      timeSchedules, 
      totalSessions, 
      sessionDurationMinutes, 
      type, // <--- Extract 'type' here so it is NOT included in 'otherUpdates'
      ...otherUpdates 
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const classDoc = await Class.findById(classId).session(session);
    
    if (!classDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Class not found" });
    }

    if(otherUpdates.batch){
      const oldBatch = await Batch.findById(classDoc.batch).session(session);
      if(oldBatch){
        oldBatch.classes.pull(classDoc._id);
        await oldBatch.save({ session });
      }
      const newBatch = await Batch.findById(otherUpdates.batch).session(session);
      if(newBatch){
        newBatch.classes.push(classDoc._id);
        await newBatch.save({ session });
      }
    }

    if (req.files) {
      const newCover = getFilePath(req.files, 'coverImage');
      const newImages = getGalleryPaths(req.files, 'images');
      if (newCover) classDoc.coverImage = newCover;
      if (newImages && newImages.length > 0) classDoc.images = newImages; 
    }

    // Apply updates (Notice 'type' is excluded because we extracted it above)
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

export const deleteClass = async (req, res) => {
  const { classId } = req.params;
  try {
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    const sessions = await Session.find({ class: classDoc._id });
    for (const s of sessions) {
      if (s.zoomMeetingId) {
        try {
          await deleteMeeting(s.zoomMeetingId);
        } catch (err) {
          console.warn("Zoom cleanup warning:", err.message);
        }
      }
    }
    await Session.deleteMany({ class: classDoc._id });
    await Class.findByIdAndDelete(classDoc._id);
    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to delete", error: err.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const populateSelect = isAdmin ? "" : "-zoomStartUrl -zoomMeetingId";
    const classDoc = await Class.findById(req.params.classId)
      .populate({
        path: "sessions",
        select: populateSelect,
        options: { sort: { index: 1 } },
      })
      .populate("batch", "name")
      .populate("linkedRevisionClass", "name slug")
      .populate("linkedPaperClass", "name slug")
      .populate("parentTheoryClass", "name slug");
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    return res.status(200).json(classDoc);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching class", error: error.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("batch", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json(classes);
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getAllPublicClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true, isPublished: true })
      .select("-sessions")
      .populate("batch", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json(classes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch public classes" });
  }
};

export const getPublicClass = async (req, res) => {
  try {
    const classDoc = await Class.findOne({
      _id: req.params.id,
      isActive: true,
      isPublished: true,
    })
      .populate("batch", "name")
      .populate({
        path: "sessions",
        select: "index startAt endAt title durationMinutes timezone",
      })
      .populate("linkedRevisionClass", "name slug type price") // <--- ADD 'price'
      .populate("linkedPaperClass", "name slug type price");   // <--- ADD 'price'

    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    return res.status(200).json(classDoc);
  } catch (error) {
    console.log("getPublicClass error:", error);
    return res.status(500).json({ message: "Error fetching class details" });
  }
};

export const activateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Not found" });
    classDoc.isActive = true;
    await classDoc.save();
    return res.status(200).json({ message: "Activated" });
  } catch (error) {
    return res.status(500).json(error);
  }
};
export const deactivateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Not found" });
    classDoc.isActive = false;
    await classDoc.save();
    return res.status(200).json({ message: "Deactivated" });
  } catch (error) {
    return res.status(500).json(error);
  }
};
