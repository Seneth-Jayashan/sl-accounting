// models/Class.js
import mongoose from "mongoose";
import slugify from "slugify";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = new mongoose.Schema({
  // 0 = Sunday ... 6 = Saturday
  day: { type: Number, min: 0, max: 6, required: true },
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
  timezone: { type: String, default: process.env.DEFAULT_TIMEZONE || "UTC" }
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, index: true, unique: true, sparse: true },

  description: { type: String, trim: true },

  // recurring weekly schedules (pattern). Use Session documents for explicit instances.
  timeSchedules: { type: [scheduleSchema], default: [] },

  // metadata for session generation
  firstSessionDate: { type: Date },               // ISO date/time of first session (optional)
  recurrence: { type: String, enum: ["weekly", "daily", "none"], default: "weekly" },
  totalSessions: { type: Number, default: 4 },    // e.g., 4 sessions total
  sessionDurationMinutes: { type: Number, default: 60 },

  // images stored as URLs (S3/CDN)
  images: [{ type: String }],

  // small apps: students array (optional - Enrollment collection is source of truth)
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // links to session docs (explicit sessions created)
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],

  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  price: { type: Number, min: 0, default: 0 },
  level: { type: String, enum: ["general", "ordinary", "advanced"], default: "general" },
  language: { type: String, default: "si" }, // "si" or "en"
  tags: [{ type: String, index: true }],
  durationMinutes: { type: Number },

  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  // Integrations - class-level defaults. Individual sessions may override.
  zoomMeetingId: { type: String },       // optional default zoom meeting id
  zoomMeetingUrl: { type: String },
  youtubePlaylistId: { type: String }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Virtual for student count
classSchema.virtual("studentCount").get(function () {
  return (this.students && this.students.length) || 0;
});



// Enroll (simple - prefer Enrollment collection & transactions in production)
classSchema.methods.enrollStudent = async function (studentId) {
  if (this.isDeleted || !this.isActive) throw new Error("Class not available");
  if (this.isFull()) throw new Error("Class is full");
  if (this.students.some(id => id.toString() === studentId.toString())) return this;
  this.students.push(studentId);
  await this.save();
  return this;
};

classSchema.methods.removeStudent = async function (studentId) {
  this.students = (this.students || []).filter(id => id.toString() !== studentId.toString());
  await this.save();
  return this;
};

// Ensure unique slug (simple loop). For heavy write loads adopt a more robust strategy.
classSchema.pre("save", async function (next) {
  if (!this.slug && this.name) {
    const base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let i = 0;
    while (await mongoose.models.Class.exists({ slug })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    this.slug = slug;
  }
  next();
});

// Indexes for common queries
classSchema.index({ isActive: 1, isPublished: 1 });
classSchema.index({ instructor: 1 });
classSchema.index({ tags: 1 });
classSchema.index({ name: "text", description: "text" });

export default mongoose.model("Class", classSchema);
