import Session from "../models/Session.js";
import Class from "../models/Class.js";
import mongoose from "mongoose";

/**
 * Helper: Check if user is instructor of the class or admin
 */
const isInstructorOrAdmin = (req, classDoc) => {
  if (!req.user) return false;
  if (req.user.isAdmin) return true;
  return classDoc.instructor && classDoc.instructor.toString() === req.user._id.toString();
};

/**
 * POST /attendance/start
 * body: { sessionId, studentId }
 */
export const markAttendanceStartController = async (req, res) => {
  const { sessionId, studentId } = req.body;

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

    await sessionDoc.markAttendanceStart(studentId);
    return res.status(200).json({ message: "Attendance start recorded", session: sessionDoc });
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

    await sessionDoc.markAttendanceEnd(studentId);
    return res.status(200).json({ message: "Attendance end recorded", session: sessionDoc });
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
    const sessionDoc = await Session.findById(sessionId)
      .populate("attendance.student", "firstName lastName email");

    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    const classDoc = await Class.findById(sessionDoc.class);
    if (!classDoc) return res.status(404).json({ message: "Parent class not found" });

    // Students can view only their own attendance
    if (!isInstructorOrAdmin(req, classDoc)) {
      const studentId = req.user._id.toString();
      const filtered = sessionDoc.attendance.filter(
        (a) => a.student._id.toString() === studentId
      );
      return res.status(200).json({ sessionId, attendance: filtered });
    }

    // Instructor/admin sees full report
    return res.status(200).json({
      sessionId,
      count: sessionDoc.attendance.length,
      attendance: sessionDoc.attendance,
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

    sessionDoc.attendance = [];
    await sessionDoc.save();

    return res.status(200).json({ message: "Attendance cleared successfully" });
  } catch (err) {
    console.error("Attendance clear error:", err);
    return res.status(500).json({ message: "Error clearing attendance", error: err.message });
  }
};
