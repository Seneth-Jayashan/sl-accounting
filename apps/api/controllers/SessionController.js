import mongoose from "mongoose";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import { createMeeting, updateMeeting, deleteMeeting } from "../services/Zoom.js";
import Enrollment from "../models/Enrollment.js";
import { format } from "date-fns";
import { sendCancellationSms } from "../utils/sms/Template.js";

// --- HELPER: Field Projection ---
const getSafeSessionProjection = (user) => {
  const isAdmin = user.role === 'admin';
  return isAdmin ? "" : "-zoomStartUrl -zoomMeetingId"; 
};

export const createSessionForClass = async (req, res) => {
  const { classId } = req.params;
  const {
    startAt, 
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

    const tz = req.body.timezone || classDoc.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
    const startMoment = moment.tz(startAt, tz);
    if (!startMoment.isValid()) throw new Error("Invalid startAt date format.");

    const endMoment = startMoment.clone().add(durationMinutes, "minutes");

    const lastSession = await Session.findOne({ class: classId }).sort({ index: -1 }).session(session);
    const nextIndex = lastSession ? (lastSession.index + 1) : 1;

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
          sessionDoc.zoomStartUrl = zoomData.start_url;
          sessionDoc.zoomJoinUrl = zoomData.join_url;
        }
      } catch (zoomErr) {
        console.error("Zoom create failed:", zoomErr.message);
      }
    }

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

export const updateSession = async (req, res) => {
  const { 
    startAt, durationMinutes, title, notes, materials, skipZoom 
  } = req.body;

  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    if (title) sessionDoc.title = title;
    if (notes) sessionDoc.notes = notes;
    if (materials) sessionDoc.materials = materials;

    let timeChanged = false;
    if (startAt) {
      const startMoment = moment(startAt); 
      if (startMoment.isValid()) {
        sessionDoc.startAt = startMoment.toDate();
        const dur = durationMinutes ? Number(durationMinutes) : moment(sessionDoc.endAt).diff(moment(sessionDoc.startAt), 'minutes');
        sessionDoc.endAt = startMoment.clone().add(dur, 'minutes').toDate();
        timeChanged = true;
      }
    }

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
        classDoc.sessions = classDoc.sessions.filter(s => s.toString() !== sessionDoc._id.toString());
        await classDoc.save({ session });
    }

    if (sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
      } catch (e) { 
        console.warn("Zoom delete skipped:", e.message); 
      }
    }

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

export const cancelSession = async (req, res) => {
  const { deleteZoomMeeting = true, cancellationReason } = req.body;

  try {
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    if (deleteZoomMeeting && sessionDoc.zoomMeetingId) {
      try {
        await deleteMeeting(sessionDoc.zoomMeetingId);
        sessionDoc.zoomMeetingId = null;
        sessionDoc.zoomStartUrl = null;
        sessionDoc.zoomJoinUrl = null;
      } catch (e) { 
        console.warn("Zoom delete warning:", e.message); 
      }
    }

    sessionDoc.isCancelled = true;
    sessionDoc.cancelledAt = new Date();
    sessionDoc.cancellationReason = cancellationReason;

    await sessionDoc.save();

    const classDoc = await Class.findById(sessionDoc.class).populate('students', 'phoneNumber');

    if (classDoc && classDoc.students && classDoc.students.length > 0) {
      
      const smsPromises = classDoc.students.map(student => {
        if (student.phoneNumber) {
           return sendCancellationSms(
             student.phoneNumber,
             classDoc.name,
             cancellationReason || "Unavoidable reasons"
           ).catch(err => console.error(`SMS failed for ${student.phoneNumber}`, err));
        }
      });

      await Promise.all(smsPromises);
    }

    return res.status(200).json({ 
        message: "Session cancelled and students notified", 
        session: sessionDoc 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const getSessionsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;
    
    const isAdmin = req.user.role === 'admin';

    const enrollment = await Enrollment.findOne({ class: classId, student: userId });
    
    const sessions = await Session.find({ class: classId }).sort({ startAt: 1 }).lean();

    if (isAdmin) {
        return res.json(sessions);
    }

    const secureSessions = sessions.map(session => {
        let isLocked = false;
        
        if (!enrollment) {
            isLocked = true;
        } else {
            const sessionDate = new Date(session.startAt);
            const sessionMonth = format(sessionDate, "yyyy-MM");

            const paidMonths = enrollment.paidMonths || [];
            const hasPaidForMonth = paidMonths.includes(sessionMonth);

            if (!hasPaidForMonth) {
                isLocked = true;
            }
        }

        if (isLocked) {
            return {
                _id: session._id,
                title: session.title,
                startAt: session.startAt,
                endAt: session.endAt,
                index: session.index,
                description: session.description, 
                isLocked: true,
                
                youtubeVideoId: null,
                recordingUrl: null,
                zoomJoinUrl: null,
                zoomStartUrl: null,
                materials: null 
            };
        }
        
        return {
            ...session,
            isLocked: false
        };
    });

    return res.json(secureSessions);

  } catch (error) {
    console.error("Get Sessions Error:", error);
    return res.status(500).json({ message: "Error fetching sessions" });
  }
};

export const getSessionAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id).populate({
      path: "attendance.student",
      select: "firstName lastName email phoneNumber avatar"
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const attendanceData = (session.attendance || []).map((record) => {
      const studentExists = !!record.student;

      return {
        _id: record._id || `${studentExists ? record.student._id : 'unknown'}-${record.joinedAt}`,
        student: studentExists ? {
          _id: record.student._id,
          firstName: record.student.firstName,
          lastName: record.student.lastName,
          email: record.student.email,
          phoneNumber: record.student.phoneNumber,
          avatar: record.student.avatar
        } : { firstName: "Deleted", lastName: "User" },
        joinedAt: record.joinedAt,
        leftAt: record.leftAt,
        durationMinutes: record.durationMinutes
      };
    });

    return res.status(200).json({
      session: {
        _id: session._id,
        title: session.title,
        index: session.index,
        startAt: session.startAt,
        endAt: session.endAt
      },
      totalAttended: attendanceData.length,
      attendance: attendanceData
    });
  } catch (error) {
    console.error("Get Session Attendance Error:", error);
    return res.status(500).json({ message: "Error fetching session attendance", error: error.message });
  }
};

export const getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;

    const sessions = await Session.find({ class: classId })
      .populate({
        path: "attendance.student",
        select: "firstName lastName email"
      })
      .sort({ startAt: 1 });

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({
        totalSessions: 0,
        sessionSummary: []
      });
    }

    const sessionSummary = sessions.map((session) => ({
      _id: session._id,
      title: session.title,
      index: session.index,
      startAt: session.startAt,
      endAt: session.endAt,
      attendanceCount: (session.attendance || []).length,
      attendance: (session.attendance || []).map((record) => ({
        _id: record._id || `${record.student._id}-${record.joinedAt}`,
        student: {
          _id: record.student._id,
          firstName: record.student.firstName,
          lastName: record.student.lastName,
          email: record.student.email
        },
        joinedAt: record.joinedAt,
        leftAt: record.leftAt,
        durationMinutes: record.durationMinutes
      }))
    }));

    return res.status(200).json({
      totalSessions: sessions.length,
      sessionSummary
    });
  } catch (error) {
    console.error("Get Class Attendance Summary Error:", error);
    return res.status(500).json({ message: "Error fetching attendance summary", error: error.message });
  }
};