import Session from "../models/Session.js";
import Class from "../models/Class.js";
import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";


const isInstructorOrAdmin = (req, classDoc) => {
  if (!req.user) return false;
  
  if (req.user.role === 'admin') return true;
  
  return classDoc.instructor && classDoc.instructor.toString() === req.user._id.toString();
};

/**
 * POST /attendance/start
 * body: { sessionId, studentId }
 */
export const markAttendanceStartController = async (req, res) => {
  let { sessionId, studentId } = req.body;

  // If the user is a student, enforce their own ID to prevent spoofing
  if (req.user && req.user.role === 'student') {
    studentId = req.user._id;
  }

  if (!sessionId || !studentId)
    return res.status(400).json({ message: "sessionId and studentId are required" });

  try {
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    // Only enrolled students OR instructor/admin may start attendance
    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    const isStudentInClass = (classDoc.students || []).some(
      (s) => s.toString() === studentId.toString()
    );

    if (!isStudentInClass && !isInstructorOrAdmin(req, classDoc)) {
      return res.status(403).json({ message: "Student is not enrolled in this class" });
    }

    await Attendance.findOneAndUpdate(
      { session: sessionId, student: studentId },
      { $setOnInsert: { class: sessionDoc.class } },
      { upsert: true, new: true }
    );
    
    return res.status(200).json({ message: "Attendance start recorded" });
  } catch (err) {
    console.error("Attendance start error:", err);
    return res.status(500).json({ message: "Error marking attendance start", error: err.message });
  }
};

/**
 * POST /attendance/end
 * body: { sessionId, studentId }
 */
export const markAttendanceEndController = async (req, res) => {
  const { sessionId, studentId } = req.body;

  if (!sessionId || !studentId)
    return res.status(400).json({ message: "sessionId and studentId are required" });

  try {
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    const isStudentInClass = (classDoc.students || []).some(
      (s) => s.toString() === studentId.toString()
    );

    if (!isStudentInClass && !isInstructorOrAdmin(req, classDoc)) {
      return res.status(403).json({ message: "Student is not enrolled in this class" });
    }

    // LeftAt functionality has been removed, so this is a no-op
    return res.status(200).json({ message: "Attendance end skipped (leftAt removed)" });
  } catch (err) {
    console.error("Attendance end error:", err);
    return res.status(500).json({ message: "Error marking attendance end", error: err.message });
  }
};

/**
 * GET /attendance/:sessionId
 */
export const getSessionAttendance = async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate("student", "firstName lastName email");

    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    // Students can view only their own attendance
    if (!isInstructorOrAdmin(req, classDoc)) {
      const studentId = req.user._id.toString();
      const filtered = attendanceRecords.filter(
        (a) => a.student._id.toString() === studentId
      );
      return res.status(200).json({ sessionId, attendance: filtered });
    }

    // Instructor/admin sees full report
    return res.status(200).json({
      sessionId,
      count: attendanceRecords.length,
      attendance: attendanceRecords,
    });
  } catch (err) {
    console.error("Attendance fetch error:", err);
    return res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};

/**
 * DELETE /attendance/:sessionId/clear
 * Clears full attendance — only instructor/admin allowed
 */
export const clearSessionAttendance = async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    if (!isInstructorOrAdmin(req, classDoc)) {
      return res.status(403).json({ message: "Only instructor/admin may clear attendance" });
    }

    await Attendance.deleteMany({ session: sessionId });

    return res.status(200).json({ message: "Attendance cleared successfully" });
  } catch (err) {
    console.error("Attendance clear error:", err);
    return res.status(500).json({ message: "Error clearing attendance", error: err.message });
  }
};

export const getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;

    const sessions = await Session.find({ class: classId }).sort({ startAt: 1 });
    const allAttendance = await Attendance.find({ class: classId }).populate("student", "firstName lastName email");

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({
        totalSessions: 0,
        sessionSummary: []
      });
    }

    const sessionSummary = sessions.map((session) => {
      const sessionAttendance = allAttendance.filter(a => a.session.toString() === session._id.toString());
      return {
        _id: session._id,
        title: session.title,
        index: session.index,
        startAt: session.startAt,
        endAt: session.endAt,
        attendanceCount: sessionAttendance.length,
        attendance: sessionAttendance.map(record => ({
          _id: record._id,
          student: record.student,
          joinedAt: record.joinedAt
        }))
      };
    });

    return res.status(200).json({
      totalSessions: sessions.length,
      sessionSummary
    });
  } catch (error) {
    console.error("Get Class Attendance Summary Error:", error);
    return res.status(500).json({ message: "Error fetching attendance summary", error: error.message });
  }
};

export const getMyClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id.toString();

    const sessions = await Session.find({ class: classId }).sort({ startAt: 1 });
    const myAttendance = await Attendance.find({ class: classId, student: studentId });

    const attendanceRecords = sessions.map(session => {
      const isPresent = myAttendance.some(a => a.session.toString() === session._id.toString());
      return {
        sessionId: session._id,
        index: session.index,
        startAt: session.startAt,
        endAt: session.endAt,
        title: session.title,
        isPresent
      };
    });

    return res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Get My Class Attendance Error:", error);
    return res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};
