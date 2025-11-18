import Class from "../models/Class.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { createClassSchema, updateClassSchema, classIdSchema } from "../validators/ClassValidator.js";

// Helper to calculate the next occurrence of a given day (0-6) from a reference date
const findNextDay = (date, targetDay) => {
    const nextDate = new Date(date);
    const dayOfWeek = nextDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = (targetDay - dayOfWeek + 7) % 7;
    nextDate.setDate(nextDate.getDate() + diff);
    return nextDate;
};

// Helper function to generate Session documents based on class recurrence rules
const generateSessions = (newClass) => {
    const sessions = [];
    const { firstSessionDate, totalSessions, sessionDurationMinutes, timeSchedules, recurrence, _id } = newClass;
    
    let currentDate = new Date(firstSessionDate);

    for (let i = 0; i < totalSessions; i++) {
        let scheduleFound = false;
        
        // Find the schedule for the current date's day of the week
        const currentDayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
        const currentSchedule = timeSchedules.find(s => s.day === currentDayOfWeek);

        if (currentSchedule) {
            scheduleFound = true;
            
            // Set Time
            const [startHour, startMinute] = currentSchedule.startTime.split(':').map(Number);
            currentDate.setHours(startHour, startMinute, 0, 0);

            const startAt = new Date(currentDate);
            const endAt = new Date(startAt.getTime() + sessionDurationMinutes * 60000); // Add duration in milliseconds

            sessions.push(new Session({
                class: _id,
                index: i + 1,
                startAt,
                endAt,
                timezone: currentSchedule.timezone,
            }));
        }

        // Determine the date of the next session
        if (recurrence === 'weekly') {
            // Move to the next week (7 days later) for the same schedule
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrence === 'daily') {
            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        } else if (recurrence === 'none' && i === 0) {
            // No recurrence, only one session is created
            break;
        } else {
            // Should not happen, but prevents infinite loop if recurrence is custom
            break;
        }
    }
    
    return sessions;
};

/**
 * Admin: Create a new class and generate associated sessions.
 */
export const createClass = async (req, res) => {
    let newClass = null;
    try {
        const validatedData = createClassSchema.parse({ body: req.body }).body;
        
        // 1. Check Duplicates (using name, slug is generated pre-save)
        const nameExists = await Class.findOne({ name: validatedData.name, isDeleted: false });

        if (nameExists) return res.status(409).json({ success: false, message: "Class with this name already exists" });

        // 2. Create Class
        newClass = new Class(validatedData);
        await newClass.save(); // Slug is generated here

        // 3. Generate and Save Sessions
        const sessionsToCreate = generateSessions(newClass);
        const savedSessions = await Session.insertMany(sessionsToCreate);
        
        // 4. Link Sessions back to Class
        newClass.sessions = savedSessions.map(s => s._id);
        await newClass.save();

        return res.status(201).json({ 
            success: true, 
            message: "Class and sessions created successfully", 
            class: newClass,
            sessionCount: savedSessions.length
        });

    } catch (error) {
        if (newClass) {
            // Rollback: Attempt to delete the partially created class and sessions on error
            await Class.deleteOne({ _id: newClass._id });
            await Session.deleteMany({ class: newClass._id });
        }
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
        }
        console.error("Create Class Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Admin: Update a class (soft delete/publish status included)
 */
export const updateClass = async (req, res) => {
    try {
        const { classId } = updateClassSchema.parse(req).params;
        const updateData = updateClassSchema.parse({ body: req.body }).body;

        const updatedClass = await Class.findOneAndUpdate(
            { _id: classId, isDeleted: false },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-isDeleted -__v -students");

        if (!updatedClass) return res.status(404).json({ success: false, message: "Class not found" });

        // If class name changed, the slug will be automatically updated by pre-save hook
        // Re-saving is necessary if the name was the only modified field that triggers the slug
        if (updateData.name && updateData.name !== updatedClass.name) {
             await updatedClass.save(); // Re-run pre-save hook for slug update
        }


        return res.status(200).json({ 
            success: true, 
            message: "Class updated successfully", 
            class: updatedClass 
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
        }
        console.error("Update Class Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Public: Get a list of all published and active classes
 */
export const getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find({ isActive: true, isPublished: true, isDeleted: false })
            .select("-isDeleted -__v -sessions -students")
            .sort({ name: 1 });
            
        return res.status(200).json({ success: true, count: classes.length, classes });
    } catch (error) {
        console.error("Get All Classes Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Student/Admin: Get details of a single class
 */
export const getClassDetails = async (req, res) => {
    try {
        const { classId } = classIdSchema.parse(req).params;
        
        const singleClass = await Class.findById(classId)
            // Ensure student can only view published/active classes
            .where({ isActive: true, isPublished: true, isDeleted: false })
            .select("-isDeleted -__v")
            .populate('sessions', 'index startAt endAt zoomJoinUrl youtubeVideoId isCancelled'); // Populate basic session info

        if (!singleClass) return res.status(404).json({ success: false, message: "Class not found" });

        return res.status(200).json({ success: true, class: singleClass });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: "Invalid Class ID format" });
        }
        console.error("Get Class Details Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Admin: Soft delete a class and its associated sessions.
 */
export const deleteClass = async (req, res) => {
    try {
        const { classId } = classIdSchema.parse(req).params;

        // 1. Soft delete the Class
        const classToDelete = await Class.findByIdAndUpdate(
            classId,
            { isDeleted: true, isActive: false, isPublished: false },
            { new: true }
        );

        if (!classToDelete) return res.status(404).json({ success: false, message: "Class not found" });

        // 2. Soft delete/cancel associated sessions
        await Session.updateMany(
            { class: classId, isCancelled: false },
            { isCancelled: true } // Mark as cancelled instead of deleting
        );

        return res.status(200).json({ 
            success: true, 
            message: `Class "${classToDelete.name}" and associated sessions soft-deleted/cancelled.`
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: "Invalid Class ID format" });
        }
        console.error("Delete Class Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


/**
 * Student: Enroll in a class
 */
export const enrollInClass = async (req, res) => {
    try {
        const { classId } = classIdSchema.parse(req).params;
        const userId = req.user._id;

        // Fetch user and class in parallel
        const [classToEnroll, user] = await Promise.all([
            Class.findById(classId),
            User.findById(userId)
        ]);

        if (!classToEnroll || classToEnroll.isDeleted || !classToEnroll.isActive || !classToEnroll.isPublished) {
            return res.status(404).json({ success: false, message: "Class not found or unavailable for enrollment" });
        }

        // Use the model's new method for validation and enrollment
        await classToEnroll.enrollStudent(userId); 
        
        // Update the user model (removed currentStudents from Class model)
        if (!user.enrolledClasses.includes(classId)) {
            user.enrolledClasses.push(classId);
            await user.save();
        }

        return res.status(200).json({ 
            success: true, 
            message: `Successfully enrolled in ${classToEnroll.name}`
        });

    } catch (error) {
        if (error.message.includes("Class not available") || error.message.includes("Class is full")) {
             return res.status(400).json({ success: false, message: error.message });
        }
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: "Invalid Class ID format" });
        }
        console.error("Enrollment Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};