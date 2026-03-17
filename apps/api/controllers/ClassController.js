import mongoose from "mongoose";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import Batch from "../models/Batch.js";
import { createMeeting, deleteMeeting } from "../services/Zoom.js";

// ==========================================
// 1. HELPERS
// ==========================================

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

const extractYouTubeVideoId = (input = "") => {
  const raw = String(input).trim();
  if (!raw) return null;

  const idLike = raw.match(/^[a-zA-Z0-9_-]{11}$/);
  if (idLike) return raw;

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const shortId = parsed.pathname.split("/").filter(Boolean)[0];
      return shortId && /^[a-zA-Z0-9_-]{11}$/.test(shortId) ? shortId : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const possibleId = parts[1];
      if (
        ["embed", "shorts", "live"].includes(parts[0]) &&
        possibleId &&
        /^[a-zA-Z0-9_-]{11}$/.test(possibleId)
      ) {
        return possibleId;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
};

const toRecordingDto = (sessionDoc) => {
  const videoId = sessionDoc.youtubeVideoId;
  return {
    _id: sessionDoc._id,
    name: sessionDoc.recordingTitle || `Session ${sessionDoc.index} Recording`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: "session",
    session: {
      _id: sessionDoc._id,
      index: sessionDoc.index,
      startAt: sessionDoc.startAt,
    },
    createdAt: sessionDoc.updatedAt,
    updatedAt: sessionDoc.updatedAt,
  };
};

/**
 * Calculates the start date/time for a specific session index based on weekly recurrence.
 */
const getNextSessionMoment = (startDateMoment, targetDayIndex, timeStr, timezone, weekOffset = 0) => {
  let m = startDateMoment.clone().tz(timezone);
  const [hour, minute] = timeStr.split(":").map(Number);
  m.set({ hour, minute, second: 0, millisecond: 0 });

  // Adjust to the correct day of the week
  if (m.day() !== targetDayIndex) {
    m.day(targetDayIndex);
    // If setting the day moves it into the past relative to start date, move to next week
    if (m.isBefore(startDateMoment)) {
      m.add(1, "week");
    }
  }

  // Add the session offset (e.g., session 2 is 1 week after session 1)
  if (weekOffset > 0) m.add(weekOffset, "week");
  return m;
};

/**
 * Internal Helper: Creates one Class Document + Associated Sessions + Zoom Meetings
 * Used by createClass to generate Theory, Revision, and Paper classes uniformly.
 */
const createSingleClassInternal = async (dbSession, data, filePaths) => {
  // 1. Config
  const classConfig = {
    ...data,
    coverImage: filePaths.coverImage,
    images: filePaths.images,
    timeSchedules: data.timeSchedules || [],
    totalSessions: data.totalSessions || 1,
    sessionDurationMinutes: data.sessionDurationMinutes || 120,
  };

  // 2. Save Class
  const newClass = new Class(classConfig);
  const savedClass = await newClass.save({ session: dbSession });

  // 3. Generate Sessions
  const schedules = Array.isArray(classConfig.timeSchedules) && classConfig.timeSchedules.length > 0
      ? classConfig.timeSchedules
      : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

  const anchorDate = classConfig.firstSessionDate ? moment(classConfig.firstSessionDate) : moment();
  const savedSessionIds = [];
  let globalIndex = 1;

  for (let i = 0; i < classConfig.totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "Asia/Colombo";
      const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, sch.timezone || tz, i);
      const endMoment = startMoment.clone().add(classConfig.sessionDurationMinutes, "minutes");

      const sessionDoc = new Session({
        class: savedClass._id,
        index: globalIndex,
        startAt: startMoment.toDate(),
        endAt: endMoment.toDate(),
        timezone: tz,
      });

      // 4. Create Zoom Meeting
      try {
        const zoomData = await createMeeting({
          topic: `${savedClass.name} - Session ${globalIndex}`,
          start_time: startMoment.format("YYYY-MM-DDTHH:mm:ss"),
          duration: classConfig.sessionDurationMinutes,
          timezone: tz,
          settings: {
            join_before_host: false,
            approval_type: 2, // No registration required
            auto_recording: "cloud",
          },
        });

        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id);
          sessionDoc.zoomStartUrl = zoomData.start_url;
          sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch (zoomErr) {
        console.warn(`[Zoom Error] Failed to create meeting for ${savedClass.name}: ${zoomErr.message}`);
        // We continue creation even if Zoom fails to avoid blocking the DB transaction
      }

      const savedSession = await sessionDoc.save({ session: dbSession });
      savedSessionIds.push(savedSession._id);
      globalIndex++;
    }
  }

  // 5. Update Class with Session IDs
  savedClass.sessions = savedSessionIds;
  await savedClass.save({ session: dbSession });

  // 6. Link to Batch
  if (classConfig.batch) {
    await Batch.findByIdAndUpdate(
      classConfig.batch,
      { $push: { classes: savedClass._id } },
      { session: dbSession }
    );
  }

  return savedClass;
};

/**
 * Internal Helper: Generates and saves Session documents and Zoom meetings for a given Class document.
 * Used by both create and update operations.
 */
const generateSessionsForClass = async (classDoc, dbSession) => {
  const schedules = Array.isArray(classDoc.timeSchedules) && classDoc.timeSchedules.length > 0
      ? classDoc.timeSchedules
      : [{ day: 0, startTime: "12:00", timezone: "UTC" }];

  const anchorDate = classDoc.firstSessionDate ? moment(classDoc.firstSessionDate) : moment();
  const savedSessionIds = [];
  let globalIndex = 1;

  for (let i = 0; i < classDoc.totalSessions; i++) {
    for (const sch of schedules) {
      const tz = sch.timezone || process.env.DEFAULT_TIMEZONE || "Asia/Colombo";
      const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, tz, i);
      const endMoment = startMoment.clone().add(classDoc.sessionDurationMinutes, "minutes");

      const sessionDoc = new Session({
        class: classDoc._id,
        index: globalIndex,
        startAt: startMoment.toDate(),
        endAt: endMoment.toDate(),
        timezone: tz,
      });

      // Create Zoom Meeting
      try {
        const zoomData = await createMeeting({
          topic: `${classDoc.name} - Session ${globalIndex}`,
          start_time: startMoment.format("YYYY-MM-DDTHH:mm:ss"),
          duration: classDoc.sessionDurationMinutes,
          timezone: tz,
          settings: {
            join_before_host: false,
            approval_type: 2, 
            auto_recording: "cloud",
          },
        });

        if (zoomData) {
          sessionDoc.zoomMeetingId = String(zoomData.id);
          sessionDoc.zoomStartUrl = zoomData.start_url;
          sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch (zoomErr) {
        console.warn(`[Zoom Error] Failed to create meeting for ${classDoc.name}: ${zoomErr.message}`);
      }

      const savedSession = await sessionDoc.save({ session: dbSession });
      savedSessionIds.push(savedSession._id);
      globalIndex++;
    }
  }

  // Update Class with new Session IDs
  classDoc.sessions = savedSessionIds;
  await classDoc.save({ session: dbSession });
};

// ==========================================
// 2. CONTROLLERS
// ==========================================

/**
 * Create Class (Handles Theory, Revision, Paper and Auto-linking)
 */
export const createClass = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      createRevision, createPaper, type, 
      revisionDay, revisionStartTime, revisionEndTime, revisionPrice,
      paperDay, paperStartTime, paperEndTime, paperPrice,
      bundlePriceRevision, bundlePricePaper, bundlePriceFull,
      parentTheoryClass, 
      ...rest
    } = req.body;

    const shouldCreateRevision = String(createRevision) === "true";
    const shouldCreatePaper = String(createPaper) === "true";

    const filePaths = {
      coverImage: getFilePath(req.files, "coverImage"),
      images: getGalleryPaths(req.files, "images") || [],
    };
    if (filePaths.images.length === 0) delete filePaths.images;

    // =========================================================
    // SCENARIO A: Creating Revision or Paper Class (Standalone OR Linked)
    // =========================================================
    if (type === 'revision' || type === 'paper') {
        
        let parent = null;

        // 1. If a Parent is provided, validate it first
        if (parentTheoryClass) {
            parent = await Class.findById(parentTheoryClass).session(session);
            if (!parent) throw new Error("Selected parent class not found.");
            if (parent.type !== 'theory') throw new Error("Parent class must be of type 'Theory'.");

            // Check existing links to prevent overwriting
            if (type === 'revision' && parent.linkedRevisionClass) {
                throw new Error(`This Theory class already has a Revision class linked. Cannot add another.`);
            }
            if (type === 'paper' && parent.linkedPaperClass) {
                throw new Error(`This Theory class already has a Paper class linked. Cannot add another.`);
            }
        }

        // 2. Create the Class (Standalone or Linked)
        // If parentTheoryClass is null/undefined, it just saves as null/undefined in DB
        const childData = { ...rest, type, parentTheoryClass };
        const newClass = await createSingleClassInternal(session, childData, filePaths);

        // 3. If Parent exists, update the link on the Parent side
        if (parent) {
            if (type === 'revision') parent.linkedRevisionClass = newClass._id;
            if (type === 'paper') parent.linkedPaperClass = newClass._id;
            await parent.save({ session });
        }

        await session.commitTransaction();
        return res.status(201).json({ 
            success: true, 
            message: parent 
                ? `${type} class created and linked to parent successfully.` 
                : `Standalone ${type} class created successfully.`, 
            class: newClass 
        });
    } 

    // =========================================================
    // SCENARIO B: Creating a Theory Class (With Optional Variants)
    // =========================================================
    else if (type === 'theory') {
        
        const primaryData = {
            ...rest,
            type: "theory",
            bundlePriceRevision: bundlePriceRevision ? Number(bundlePriceRevision) : undefined,
            bundlePricePaper: bundlePricePaper ? Number(bundlePricePaper) : undefined,
            bundlePriceFull: bundlePriceFull ? Number(bundlePriceFull) : undefined,
        };

        // 1. Create Parent Theory Class
        const primaryClass = await createSingleClassInternal(session, primaryData, filePaths);

        // 2. Create Variants if requested
        let revisionId = null;
        let paperId = null;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo";

        // Auto-create Revision
        if (shouldCreateRevision && revisionDay !== undefined) {
            const revClass = await createSingleClassInternal(session, {
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
                type: "revision",
                parentTheoryClass: primaryClass._id, 
                timeSchedules: [{ day: Number(revisionDay), startTime: revisionStartTime, endTime: revisionEndTime, timezone }],
                sessionDurationMinutes: moment(revisionEndTime, "HH:mm").diff(moment(revisionStartTime, "HH:mm"), "minutes"),
            }, filePaths);
            revisionId = revClass._id;
        }

        // Auto-create Paper
        if (shouldCreatePaper && paperDay !== undefined) {
            const papClass = await createSingleClassInternal(session, {
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
                type: "paper",
                parentTheoryClass: primaryClass._id, 
                timeSchedules: [{ day: Number(paperDay), startTime: paperStartTime, endTime: paperEndTime, timezone }],
                sessionDurationMinutes: moment(paperEndTime, "HH:mm").diff(moment(paperStartTime, "HH:mm"), "minutes"),
            }, filePaths);
            paperId = papClass._id;
        }

        // 3. Update Parent with Links
        if (revisionId || paperId) {
            if (revisionId) primaryClass.linkedRevisionClass = revisionId;
            if (paperId) primaryClass.linkedPaperClass = paperId;
            await primaryClass.save({ session });
        }

        await session.commitTransaction();
        return res.status(201).json({ success: true, message: "Class created successfully", class: primaryClass });
    
    } else {
        throw new Error("Invalid class type selected.");
    }

  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("createClass error:", error);
    return res.status(500).json({ message: error.message || "Error creating class" });
  } finally {
    session.endSession();
  }
};

/**
 * Update Class (Intelligently handles schedule comparisons and variants)
 */
export const updateClass = async (req, res) => {
  const { classId } = req.params;
  
  // Extract schedule and variant fields separately for deep comparison
  const { 
    timeSchedules, 
    totalSessions, 
    sessionDurationMinutes, 
    firstSessionDate,
    type, 
    
    // Variant config
    createRevision,
    createPaper,
    revisionDay,
    revisionStartTime,
    revisionEndTime,
    revisionPrice,
    paperDay,
    paperStartTime,
    paperEndTime,
    paperPrice,
    bundlePriceRevision,
    bundlePricePaper,
    bundlePriceFull,

    ...otherUpdates 
  } = req.body;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch Class and populated linked variants
    const classDoc = await Class.findById(classId)
        .populate('linkedRevisionClass')
        .populate('linkedPaperClass')
        .session(session);
        
    if (!classDoc) throw new Error("Class not found");

    // 2. Handle Batch Change
    if (otherUpdates.batch && otherUpdates.batch !== String(classDoc.batch)) {
        await Batch.findByIdAndUpdate(classDoc.batch, { $pull: { classes: classDoc._id } }, { session });
        await Batch.findByIdAndUpdate(otherUpdates.batch, { $addToSet: { classes: classDoc._id } }, { session });
    }

    // 3. Handle File Uploads (FormData)
    if (req.files) {
      const newCover = getFilePath(req.files, 'coverImage');
      const newImages = getGalleryPaths(req.files, 'images');
      if (newCover) classDoc.coverImage = newCover;
      if (newImages && newImages.length > 0) classDoc.images = newImages; 
    }

    // 4. --- SMART SCHEDULE COMPARISON LOGIC (MAIN CLASS) ---
    let willReplaceSchedule = false;

    // Parse timeSchedules if it arrives as a JSON string (common in FormData)
    let parsedIncomingSchedules = timeSchedules;
    if (typeof timeSchedules === 'string') {
        try { parsedIncomingSchedules = JSON.parse(timeSchedules); } catch (e) {}
    }

    if (parsedIncomingSchedules) {
        const existingSchedules = classDoc.timeSchedules ? classDoc.timeSchedules.map(ts => ({
            day: Number(ts.day),
            startTime: ts.startTime,
            endTime: ts.endTime
        })) : [];
        
        const incomingSchedulesClean = parsedIncomingSchedules.map(ts => ({
            day: Number(ts.day),
            startTime: ts.startTime,
            endTime: ts.endTime
        }));

        if (JSON.stringify(existingSchedules) !== JSON.stringify(incomingSchedulesClean)) {
            willReplaceSchedule = true;
        }
    }

    if (totalSessions !== undefined && Number(totalSessions) !== classDoc.totalSessions) {
        willReplaceSchedule = true;
    }
    if (sessionDurationMinutes !== undefined && Number(sessionDurationMinutes) !== classDoc.sessionDurationMinutes) {
        willReplaceSchedule = true;
    }
    if (firstSessionDate !== undefined && new Date(firstSessionDate).getTime() !== new Date(classDoc.firstSessionDate).getTime()) {
        willReplaceSchedule = true;
    }

    // 5. Apply Basic Fields to Main Document
    Object.assign(classDoc, otherUpdates);
    if (type !== undefined) classDoc.type = type;
    if (parsedIncomingSchedules) classDoc.timeSchedules = parsedIncomingSchedules;
    if (totalSessions !== undefined) classDoc.totalSessions = Number(totalSessions);
    if (sessionDurationMinutes !== undefined) classDoc.sessionDurationMinutes = Number(sessionDurationMinutes);
    if (firstSessionDate !== undefined) classDoc.firstSessionDate = firstSessionDate;

    // 6. Handle Variants (Revision / Paper Classes)
    const isCreateRevision = String(createRevision) === 'true';
    const isCreatePaper = String(createPaper) === 'true';

    if (classDoc.type === 'theory') {
        // Update Bundle Prices
        if (bundlePriceRevision !== undefined) classDoc.bundlePriceRevision = Number(bundlePriceRevision);
        if (bundlePricePaper !== undefined) classDoc.bundlePricePaper = Number(bundlePricePaper);
        if (bundlePriceFull !== undefined) classDoc.bundlePriceFull = Number(bundlePriceFull);

        // --- UPDATE REVISION CLASS ---
        if (isCreateRevision && classDoc.linkedRevisionClass) {
            const revClass = classDoc.linkedRevisionClass; // Already populated
            let revScheduleChanged = false;
            
            if (revisionDay !== undefined || revisionStartTime || revisionEndTime) {
                const newRevSchedule = {
                    day: Number(revisionDay ?? revClass.timeSchedules[0]?.day),
                    startTime: revisionStartTime ?? revClass.timeSchedules[0]?.startTime,
                    endTime: revisionEndTime ?? revClass.timeSchedules[0]?.endTime
                };
                
                const oldRevSchedule = revClass.timeSchedules[0];
                if (!oldRevSchedule || 
                    oldRevSchedule.day !== newRevSchedule.day || 
                    oldRevSchedule.startTime !== newRevSchedule.startTime || 
                    oldRevSchedule.endTime !== newRevSchedule.endTime) {
                    
                    revScheduleChanged = true;
                    revClass.timeSchedules = [newRevSchedule];
                }
            }

            if (revisionPrice !== undefined) revClass.price = Number(revisionPrice);
            revClass.name = `${classDoc.name} - Revision`;
            revClass.description = classDoc.description;
            if (classDoc.coverImage) revClass.coverImage = classDoc.coverImage;

            await revClass.save({ session });

            // Regenerate Revision Sessions if needed
            if (revScheduleChanged) {
                const oldRevSessions = await Session.find({ class: revClass._id }).session(session);
                for (const s of oldRevSessions) {
                    if (s.zoomMeetingId) {
                        try { await deleteMeeting(s.zoomMeetingId); } catch (e) {}
                    }
                }
                await Session.deleteMany({ class: revClass._id }).session(session);
                await generateSessionsForClass(revClass, session);
            }
        }

        // --- UPDATE PAPER CLASS ---
        if (isCreatePaper && classDoc.linkedPaperClass) {
            const papClass = classDoc.linkedPaperClass;
            let papScheduleChanged = false;
            
            if (paperDay !== undefined || paperStartTime || paperEndTime) {
                const newPapSchedule = {
                    day: Number(paperDay ?? papClass.timeSchedules[0]?.day),
                    startTime: paperStartTime ?? papClass.timeSchedules[0]?.startTime,
                    endTime: paperEndTime ?? papClass.timeSchedules[0]?.endTime
                };
                
                const oldPapSchedule = papClass.timeSchedules[0];
                if (!oldPapSchedule || 
                    oldPapSchedule.day !== newPapSchedule.day || 
                    oldPapSchedule.startTime !== newPapSchedule.startTime || 
                    oldPapSchedule.endTime !== newPapSchedule.endTime) {
                    
                    papScheduleChanged = true;
                    papClass.timeSchedules = [newPapSchedule];
                }
            }

            if (paperPrice !== undefined) papClass.price = Number(paperPrice);
            papClass.name = `${classDoc.name} - Paper Class`;
            papClass.description = classDoc.description;
            if (classDoc.coverImage) papClass.coverImage = classDoc.coverImage;

            await papClass.save({ session });

            // Regenerate Paper Sessions if needed
            if (papScheduleChanged) {
                const oldPapSessions = await Session.find({ class: papClass._id }).session(session);
                for (const s of oldPapSessions) {
                    if (s.zoomMeetingId) {
                        try { await deleteMeeting(s.zoomMeetingId); } catch (e) {}
                    }
                }
                await Session.deleteMany({ class: papClass._id }).session(session);
                await generateSessionsForClass(papClass, session);
            }
        }
    }

    await classDoc.save({ session });

    // 7. Handle Session Regeneration for MAIN class ONLY if schedule actually changed
    if (willReplaceSchedule) {
      console.log(`Schedule changed for class ${classDoc._id}. Recreating sessions...`);
      
      const existingSessions = await Session.find({ class: classDoc._id }).session(session);
      
      // Cleanup old Zoom
      for (const s of existingSessions) {
        if (s.zoomMeetingId) {
            try { await deleteMeeting(s.zoomMeetingId); } 
            catch (e) { console.warn("Zoom cleanup warning", e.message); }
        }
      }
      
      // Delete old sessions in database
      await Session.deleteMany({ class: classDoc._id }).session(session);

      // Re-run session generation using the helper
      await generateSessionsForClass(classDoc, session);
      
    } else {
      console.log(`No schedule changes for class ${classDoc._id}. Keeping existing sessions.`);
    }

    await session.commitTransaction();
    
    // Repopulate for response
    const updatedClass = await Class.findById(classDoc._id)
        .populate('linkedRevisionClass')
        .populate('linkedPaperClass');

    return res.status(200).json({ success: true, message: "Class updated successfully", class: updatedClass });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Update Class Error:", err);
    return res.status(500).json({ message: err.message || "Failed to update class" });
  } finally {
    session.endSession();
  }
};

/**
 * Delete Class (Handles Cascade Unlinking)
 */
export const deleteClass = async (req, res) => {
  const { classId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Class not found" });
    }

    // 1. CLEANUP PARENT REFERENCES (If this deleted class was a Child)
    if (classDoc.type === 'revision' || classDoc.type === 'paper') {
       // Find any parent linking to this class
       const parent = await Class.findOne({
           $or: [
               { linkedRevisionClass: classDoc._id },
               { linkedPaperClass: classDoc._id }
           ]
       }).session(session);

       if (parent) {
           if (String(parent.linkedRevisionClass) === String(classDoc._id)) {
               parent.linkedRevisionClass = null;
           }
           if (String(parent.linkedPaperClass) === String(classDoc._id)) {
               parent.linkedPaperClass = null;
           }
           await parent.save({ session });
       }
    }

    // 2. CLEANUP CHILD REFERENCES (If this deleted class was a Parent)
    // We unlink children so they don't point to a dead parent ID.
    if (classDoc.linkedRevisionClass) {
        await Class.findByIdAndUpdate(classDoc.linkedRevisionClass, { parentTheoryClass: null }, { session });
    }
    if (classDoc.linkedPaperClass) {
        await Class.findByIdAndUpdate(classDoc.linkedPaperClass, { parentTheoryClass: null }, { session });
    }

    // 3. Delete Zoom Meetings
    const sessions = await Session.find({ class: classDoc._id }).session(session);
    for (const s of sessions) {
      if (s.zoomMeetingId) {
        try {
          await deleteMeeting(s.zoomMeetingId);
        } catch (err) {
          console.warn(`[Zoom Warning] Failed to delete meeting ${s.zoomMeetingId}`);
        }
      }
    }

    // 4. Delete Database Records
    await Session.deleteMany({ class: classDoc._id }).session(session);
    await Class.findByIdAndDelete(classDoc._id).session(session);
    
    // Also remove from Batch
    if (classDoc.batch) {
        await Batch.findByIdAndUpdate(classDoc.batch, { $pull: { classes: classDoc._id } }, { session });
    }

    await session.commitTransaction();
    return res.status(200).json({ message: "Class deleted successfully" });

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: "Failed to delete", error: err.message });
  } finally {
    session.endSession();
  }
};

// ==========================================
// 3. READ OPERATIONS (No Transaction Needed)
// ==========================================

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
      .populate("linkedRevisionClass", "name slug type")
      .populate("linkedPaperClass", "name slug type")
      .populate("parentTheoryClass", "name slug type");
      
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    return res.status(200).json(classDoc);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching class", error: error.message });
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
      .populate("linkedRevisionClass", "name slug type price")
      .populate("linkedPaperClass", "name slug type price");

    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    return res.status(200).json(classDoc);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching class details" });
  }
};

export const activateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findByIdAndUpdate(classId, { isActive: true }, { new: true });
    if (!classDoc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Activated", class: classDoc });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const deactivateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findByIdAndUpdate(classId, { isActive: false }, { new: true });
    if (!classDoc) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Deactivated", class: classDoc });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getClassRecordings = async (req, res) => {
  try {
    const { classId } = req.params;
    const classExists = await Class.exists({ _id: classId });
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const sessions = await Session.find({
      class: classId,
      youtubeVideoId: { $exists: true, $nin: [null, ""] },
    })
      .select("_id index startAt youtubeVideoId recordingTitle updatedAt")
      .sort({ startAt: -1 });

    const recordings = sessions.map(toRecordingDto);
    return res.status(200).json({ success: true, recordings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch recordings" });
  }
};

export const addClassRecording = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, url, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session is required" });
    }

    if (!url || !String(url).trim()) {
      return res.status(400).json({ success: false, message: "YouTube URL or Video ID is required" });
    }

    const classExists = await Class.exists({ _id: classId });
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const targetSession = await Session.findOne({ _id: sessionId, class: classId });
    if (!targetSession) {
      return res.status(400).json({ success: false, message: "Session does not belong to this class" });
    }

    const youtubeVideoId = extractYouTubeVideoId(url);
    if (!youtubeVideoId) {
      return res.status(400).json({ success: false, message: "Invalid YouTube URL or Video ID" });
    }

    const existing = await Session.findOne({
      class: classId,
      youtubeVideoId,
      _id: { $ne: targetSession._id },
    }).select("_id index startAt youtubeVideoId recordingTitle updatedAt");

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Recording already exists for this class",
        recording: toRecordingDto(existing),
      });
    }

    targetSession.youtubeVideoId = youtubeVideoId;
    targetSession.recordingShared = true;
    if (name && String(name).trim()) {
      targetSession.recordingTitle = String(name).trim();
    }
    await targetSession.save();

    return res.status(201).json({
      success: true,
      message: "Recording added",
      recording: toRecordingDto(targetSession),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to add recording", error: error.message });
  }
};

export const updateClassRecording = async (req, res) => {
  try {
    const { classId, recordingId } = req.params;
    const { name, url } = req.body;

    if (!name && !url) {
      return res.status(400).json({ success: false, message: "Provide name or url to update" });
    }

    const classExists = await Class.exists({ _id: classId });
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const sessionDoc = await Session.findOne({ _id: recordingId, class: classId });
    if (!sessionDoc || !sessionDoc.youtubeVideoId) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (name) sessionDoc.recordingTitle = String(name).trim();

    if (url) {
      const newVideoId = extractYouTubeVideoId(url);
      if (!newVideoId) {
        return res.status(400).json({ success: false, message: "Invalid YouTube URL or Video ID" });
      }

      const duplicate = await Session.findOne({
        class: classId,
        youtubeVideoId: newVideoId,
        _id: { $ne: recordingId },
      }).select("_id");

      if (duplicate) {
        return res.status(409).json({ success: false, message: "Another recording already uses this url" });
      }

      sessionDoc.youtubeVideoId = newVideoId;
      sessionDoc.recordingShared = true;
    }

    await sessionDoc.save();
    return res.status(200).json({ success: true, message: "Recording updated", recording: toRecordingDto(sessionDoc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update recording", error: error.message });
  }
};

export const deleteClassRecording = async (req, res) => {
  try {
    const { classId, recordingId } = req.params;
    const classExists = await Class.exists({ _id: classId });
    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const sessionDoc = await Session.findOne({ _id: recordingId, class: classId });
    if (!sessionDoc || !sessionDoc.youtubeVideoId) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    sessionDoc.youtubeVideoId = undefined;
    sessionDoc.recordingShared = false;
    sessionDoc.recordingTitle = undefined;
    await sessionDoc.save();

    return res.status(200).json({ success: true, message: "Recording removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to remove recording", error: error.message });
  }
};