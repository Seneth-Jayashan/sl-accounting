// models/Class.js
import mongoose from "mongoose";
import slugify from "slugify";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true }, // 0=Sun, 6=Sat
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: (v) => timeRegex.test(v),
      message: (props) => `${props.value} is not a valid time (HH:mm)`
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: (v) => timeRegex.test(v),
      message: (props) => `${props.value} is not a valid time (HH:mm)`
    }
  },
  timezone: { type: String, default: process.env.DEFAULT_TIMEZONE || "Asia/Colombo" }
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  // Unique URL-friendly identifier
  slug: { type: String, index: true, unique: true, sparse: true },

  description: { type: String, trim: true },

  // Array of schedules (e.g., Mon 10am, Wed 2pm)
  timeSchedules: { type: [scheduleSchema], default: [] },

  recurrence: { type: String, enum: ["weekly", "daily", "none"], default: "weekly" },
  totalSessions: { type: Number, default: 4 },   
  sessionDurationMinutes: { type: Number, default: 60 },

  // Media
  images: [{ type: String }],
  coverImage: { type: String },

  firstSessionDate: { type: Date },

  // Note: For large classes, rely on the 'Enrollment' collection instead of this array
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Linked Sessions (Calendar Events)
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session", default: [] }],

  price: { type: Number, min: 0, default: 0 },

  // Grouping
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
  
  level: { type: String, enum: ["general", "ordinary", "advanced"], default: "general" },
  tags: [{ type: String, index: true }], // 'index: true' here is sufficient

  // Status flags
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---

classSchema.virtual("studentCount").get(function () {
  return (this.students && this.students.length) || 0;
});

// --- METHODS ---

classSchema.methods.enrollStudent = async function (studentId) {
  if (this.isDeleted || !this.isActive) throw new Error("Class not available");
  
  const sid = studentId.toString();
  // Avoid duplicates
  if (this.students.some(id => id.toString() === sid)) return this;
  
  this.students.push(studentId);
  return this.save();
};

classSchema.methods.removeStudent = async function (studentId) {
  const sid = studentId.toString();
  this.students = (this.students || []).filter(id => id.toString() !== sid);
  return this.save();
};

// --- HOOKS ---

// Auto-generate Slug on Save
classSchema.pre("save", async function (next) {
  // Only generate if name changed or slug missing
  if ((this.isNew || this.isModified('name')) && !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let i = 0;
    
    // Ensure uniqueness
    // Note: In extremely high concurrency, this might still clash, but fine for classes
    while (await mongoose.models.Class.exists({ slug, _id: { $ne: this._id } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    this.slug = slug;
  }
  next();
});

// --- INDEXES ---

// Compound index for filtering active/published classes efficiently
classSchema.index({ isActive: 1, isPublished: 1 });

// Text search index
classSchema.index({ name: "text", description: "text" });

// Redundant single-field indexes removed to clear warnings:
// - tags: Defined in schema options
// - instructor: Field doesn't exist in schema (removed)

export default mongoose.model("Class", classSchema);