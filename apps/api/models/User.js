import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // store normalized phone (E.164 recommended) in controllers before saving
  phoneNumber: { type: String, required: true, unique: true, trim: true },

  // do not return password by default
  password: { type: String, required: true, minlength: 6, select: false },

  role: { type: String, enum: ["admin", "student"], default: "student" },

  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  profileImage: { type: String, default: null },

  // optional quick reference (not source of truth — enrollment collection is)
  enrolledClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
  grade: { type: String },

  // service/payment fields
  nextPaymentDate: { type: Date },
  paymentStatus: { type: String, enum: ["paid", "unpaid", "pending"], default: "unpaid" },

  // security
  otp: { type: String },
  otpExpiresAt: { type: Date },

  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },

  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now }
  }],

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  isVerified: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

// env-configurable salt rounds
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

// Hash password on save (only when modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Compare password - assumes the instance has `password` loaded (use .select("+password") when querying)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Sanitize output
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // remove sensitive fields
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.refreshTokens;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.isDeleted;

  return obj;
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);
