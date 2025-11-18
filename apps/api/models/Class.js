// models/Class.js
import mongoose from "mongoose";
import slugify from "slugify";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = new mongoose.Schema({
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

  timeSchedules: { type: [scheduleSchema], default: [] },

  firstSessionDate: { type: Date },               // ISO date/time of first session (optional)
  recurrence: { type: String, enum: ["weekly", "daily", "none"], default: "weekly" },
  totalSessions: { type: Number, default: 4 },    // e.g., 4 sessions total
  sessionDurationMinutes: { type: Number, default: 60 },

  images: [{ type: String }],

  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],

  price: { type: Number, min: 0, default: 0 },
  level: { type: String, enum: ["general", "ordinary", "advanced"], default: "general" },
  language: { type: String, default: "si" }, 
  tags: [{ type: String, index: true }],
  durationMinutes: { type: Number },

  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  zoomMeetingId: { type: String },      
  zoomMeetingUrl: { type: String },
  youtubePlaylistId: { type: String }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


classSchema.virtual("studentCount").get(function () {
  return (this.students && this.students.length) || 0;
});



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

classSchema.index({ isActive: 1, isPublished: 1 });
classSchema.index({ instructor: 1 });
classSchema.index({ tags: 1 });
classSchema.index({ name: "text", description: "text" });

export default mongoose.model("Class", classSchema);
