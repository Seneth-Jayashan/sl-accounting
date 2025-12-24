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
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: { type: String, required: true, trim: true },

    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch"},

    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["admin", "student"], default: "student" },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },

    profileImage: { type: String, default: null },

    // OTP fields (hashed)
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, index: true },
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

/* -------------------- password hashing -------------------- */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (err) {
    return next(err);
  }
});

/* -------------------- instance helpers -------------------- */

/**
 * Generate a 6-digit numeric OTP code, hash it and store hash in `otp`.
 * Returns the plain 6-digit code (string). DOES NOT save the document.
 *
 * opts:
 *  - ttlMs: time-to-live in milliseconds (default 10 minutes)
 *  - attemptsReset: whether to reset otpAttempts to 0 (default true)
 */
userSchema.methods.generateOtpCode = function (opts = {}) {
  const ttlMs = typeof opts.ttlMs === "number" ? opts.ttlMs : 10 * 60 * 1000; // default 10 minutes
  const attemptsReset = opts.attemptsReset ?? true;

  // Generate 6-digit code (string), preserving leading zeros
  const plainCode = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);

  // Hash using sha256
  const hashed = crypto.createHash("sha256").update(String(plainCode)).digest("hex");

  this.otp = hashed;
  this.otpExpiresAt = new Date(Date.now() + ttlMs);
  if (attemptsReset) this.otpAttempts = 0;

  // Return plain code for sending via email/SMS
  return plainCode;
};

/**
 * Verify a plain 6-digit code.
 *
 * Behavior:
 *  - Returns an object: { ok: boolean, reason?: string, user?: this }
 *  - If `opts.saveOnSuccess === true` and verification succeeds, marks `isVerified = true`,
 *    clears otp fields and saves the document (returns saved user).
 *
 * opts:
 *  - saveOnSuccess: boolean (default true)
 *  - maxAttempts: number (default 5) -> when exceeded, method returns locked response
 *
 * Note: this function will increment `otpAttempts` on a failed attempt and save if `saveOnSuccess` or `opts.saveOnFailure` is true.
 */
userSchema.methods.verifyOtpCode = async function (plainCode, opts = {}) {
  const saveOnSuccess = opts.saveOnSuccess ?? true;
  const saveOnFailure = opts.saveOnFailure ?? false;
  const maxAttempts = typeof opts.maxAttempts === "number" ? opts.maxAttempts : 5;

  // Check if already verified
  if (this.isVerified) {
    return { ok: true, reason: "already_verified", user: this };
  }

  // Check existence
  if (!this.otp || !this.otpExpiresAt) {
    return { ok: false, reason: "no_otp" };
  }

  // Check expiry
  if (Date.now() > new Date(this.otpExpiresAt).getTime()) {
    // Clear expired OTP fields
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    this.otpAttempts = 0;
    if (saveOnFailure) await this.save();
    return { ok: false, reason: "expired" };
  }

  // Check attempts limit
  if (this.otpAttempts >= maxAttempts) {
    // optional: mark account locked or similar
    return { ok: false, reason: "max_attempts_exceeded" };
  }

  // Hash provided code and compare
  const hashed = crypto.createHash("sha256").update(String(plainCode)).digest("hex");
  const matched = hashed === this.otp;

  if (matched) {
    // Success: mark verified and clear OTP fields
    this.isVerified = true;
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    this.otpAttempts = 0;

    if (saveOnSuccess) {
      await this.save();
      return { ok: true, reason: "verified", user: this };
    } else {
      return { ok: true, reason: "verified", user: this };
    }
  } else {
    // Failed attempt: increment attempts
    this.otpAttempts = (this.otpAttempts || 0) + 1;
    if (saveOnFailure) await this.save();

    const remaining = Math.max(0, maxAttempts - this.otpAttempts);
    return { ok: false, reason: "invalid_code", attempts: this.otpAttempts, remaining };
  }
};

/**
 * Clear otp fields (does NOT save the doc).
 */
userSchema.methods.clearOtp = function () {
  this.otp = undefined;
  this.otpExpiresAt = undefined;
  this.otpAttempts = 0;
};

/* -------------------- static helpers -------------------- */

/**
 * Clear expired OTPs across users.
 * Useful to run periodically (cron job) to remove expired OTP hashes so they are not stored forever.
 *
 * Example usage:
 *   await User.clearExpiredOtps();
 *
 * Returns a summary object { matchedCount, modifiedCount }.
 */
userSchema.statics.clearExpiredOtps = async function () {
  const now = new Date();
  const res = await this.updateMany(
    { otp: { $exists: true }, otpExpiresAt: { $lte: now } },
    { $unset: { otp: "", otpExpiresAt: "" }, $set: { otpAttempts: 0 } }
  );
  return res;
};

/* -------------------- other helpers (existing) -------------------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.refreshTokens;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.isDeleted;
  delete obj.otpAttempts; // keep internal counters private

  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ otpExpiresAt: 1 }); // useful for cleanup

export default mongoose.model("User", userSchema);
