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

  // Array of schedules
  timeSchedules: { type: [scheduleSchema], default: [] },

  recurrence: { type: String, enum: ["weekly", "daily", "none"], default: "weekly" },
  totalSessions: { type: Number, default: 4 },   
  sessionDurationMinutes: { type: Number, default: 60 },

  // Media
  images: [{ type: String }],
  coverImage: { type: String },

  firstSessionDate: { type: Date },

  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Linked Sessions (Calendar Events)
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session", default: [] }],

  price: { type: Number, min: 0, default: 0 },

  // Grouping
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
  
  level: { type: String, enum: ["general", "ordinary", "advanced"], default: "general" },
  type: { type: String, enum: ["theory", "revision", "paper"], default: "theory" },
  tags: [{ type: String, index: true }],

  // --- NEW LINKED CLASS FIELDS ---
  // If this is a Theory class, these point to the generated variants
  linkedRevisionClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
  linkedPaperClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },

  // If this is a Revision or Paper class, this points back to the main Theory class
  parentTheoryClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },

  // --- BUNDLE PRICING (Admin defined offers) ---
  bundlePriceRevision: { type: Number, default: null }, // Price for Theory + Revision
  bundlePricePaper: { type: Number, default: null },    // Price for Theory + Paper
  bundlePriceFull: { type: Number, default: null },     // Price for Theory + Revision + Paper

  // Status flags
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
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

classSchema.pre("save", async function (next) {
  if ((this.isNew || this.isModified('name')) && !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let i = 0;
    while (await mongoose.models.Class.exists({ slug, _id: { $ne: this._id } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    this.slug = slug;
  }
  next();
});

// --- INDEXES ---

classSchema.index({ isActive: 1, isPublished: 1 });
classSchema.index({ name: "text", description: "text" });

export default mongoose.model("Class", classSchema);