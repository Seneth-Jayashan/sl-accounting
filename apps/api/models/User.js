// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true, // Automatically creates an index
      lowercase: true,
      trim: true,
    },

    regNo: { type: String, unique: true, sparse: true, trim: true, index: true },

    phoneNumber: { type: String, required: true, trim: true, index: true },

    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },

    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["admin", "student"], default: "student", index: true },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },

    profileImage: { type: String, default: null },

    // OTP fields (hashed for security)
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, index: true }, // Index useful for cleanup jobs
    otpAttempts: { type: Number, default: 0, select: false },

    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },

    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    isVerified: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

/* -------------------- Password Hashing Hook -------------------- */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.pre("save", async function (next) {
  // Auto-generate regNo for new students if not provided
  if (this.isNew && this.role === "student" && !this.regNo) {
    try {
      // Find the last student created that has a regNo starting with "STU-"
      const lastStudent = await this.constructor.findOne(
        { role: "student", regNo: { $regex: /^STU-/ } }
      ).sort({ regNo: -1 }); // Sort descending to get the highest number

      let nextNum = 1;

      if (lastStudent && lastStudent.regNo) {
        // Extract number part: "STU-005" -> "005" -> 5
        const lastStr = lastStudent.regNo.split("-")[1];
        if (lastStr && !isNaN(lastStr)) {
          nextNum = parseInt(lastStr, 10) + 1;
        }
      }

      // Format with padding: 1 -> "001", 12 -> "012", 123 -> "123"
      this.regNo = `STU-${nextNum.toString().padStart(3, "0")}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

/* -------------------- Instance Methods -------------------- */

/**
 * Generate 6-digit OTP, Hash it, Set Expiry.
 * Returns: Plain text OTP (to send via email/SMS).
 */
userSchema.methods.generateOtpCode = function (opts = {}) {
  const ttlMs = typeof opts.ttlMs === "number" ? opts.ttlMs : 10 * 60 * 1000; // 10 mins
  const attemptsReset = opts.attemptsReset ?? true;

  // Generate 6-digit numeric string
  const plainCode = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);

  // Hash before saving
  this.otp = crypto.createHash("sha256").update(String(plainCode)).digest("hex");
  this.otpExpiresAt = new Date(Date.now() + ttlMs);
  
  if (attemptsReset) this.otpAttempts = 0;

  return plainCode;
};

/**
 * Verify OTP
 */
userSchema.methods.verifyOtpCode = async function (plainCode, opts = {}) {
  const saveOnSuccess = opts.saveOnSuccess ?? true;
  const saveOnFailure = opts.saveOnFailure ?? true; // Safer to save failures to increment count
  const maxAttempts = typeof opts.maxAttempts === "number" ? opts.maxAttempts : 5;

  // 1. Check verified status
  if (this.isVerified) {
    return { ok: true, reason: "already_verified", user: this };
  }

  // 2. Check existence
  if (!this.otp || !this.otpExpiresAt) {
    return { ok: false, reason: "no_otp" };
  }

  // 3. Check expiry
  if (Date.now() > new Date(this.otpExpiresAt).getTime()) {
    this.clearOtp();
    if (saveOnFailure) await this.save();
    return { ok: false, reason: "expired" };
  }

  // 4. Check Rate Limit
  if (this.otpAttempts >= maxAttempts) {
    return { ok: false, reason: "max_attempts_exceeded" };
  }

  // 5. Verify Hash
  const hashedInput = crypto.createHash("sha256").update(String(plainCode)).digest("hex");
  const isMatch = hashedInput === this.otp;

  if (isMatch) {
    // Success
    this.isVerified = true;
    this.clearOtp();
    if (saveOnSuccess) await this.save();
    return { ok: true, reason: "verified", user: this };
  } else {
    // Failure
    this.otpAttempts = (this.otpAttempts || 0) + 1;
    if (saveOnFailure) await this.save();
    
    const remaining = Math.max(0, maxAttempts - this.otpAttempts);
    return { ok: false, reason: "invalid_code", attempts: this.otpAttempts, remaining };
  }
};

/**
 * Helper to clear OTP fields from memory
 */
userSchema.methods.clearOtp = function () {
  this.otp = undefined;
  this.otpExpiresAt = undefined;
  this.otpAttempts = 0;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* -------------------- Data Sanitization -------------------- */
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.refreshTokens;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.otpAttempts; 
  delete obj.loginAttempts;
  delete obj.__v;

  return obj;
};

/* -------------------- Static Methods -------------------- */

/**
 * Cron Job Helper: Remove expired OTPs to keep DB clean
 */
userSchema.statics.clearExpiredOtps = async function () {
  const now = new Date();
  return this.updateMany(
    { otp: { $exists: true }, otpExpiresAt: { $lte: now } },
    { $unset: { otp: "", otpExpiresAt: "" }, $set: { otpAttempts: 0 } }
  );
};

// Explicit indexes removed to prevent duplication warnings.
// Indexes defined in schema options (unique: true, index: true) are sufficient.

export default mongoose.model("User", userSchema);