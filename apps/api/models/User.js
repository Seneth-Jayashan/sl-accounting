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
      nearestPostOffice: String,
    },

    profileImage: { type: String, default: null },

    zoomUserId: { type: String, sparse: true, index: true },

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
  if (this.isNew && this.role === "student" && !this.regNo) {
    try {
      const lastStudent = await this.constructor.findOne(
        { role: "student", regNo: { $regex: /^STU-/ } }
      ).sort({ createdAt: -1 }); 

      let nextNum = 1;

      if (lastStudent && lastStudent.regNo) {
        const lastStr = lastStudent.regNo.split("-")[1];
        if (lastStr && !isNaN(lastStr)) {
          nextNum = parseInt(lastStr, 10) + 1;
        }
      }

      this.regNo = `STU-${nextNum.toString().padStart(3, "0")}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

/* -------------------- Instance Methods -------------------- */

userSchema.methods.generateOtpCode = function (opts = {}) {
  const ttlMs = typeof opts.ttlMs === "number" ? opts.ttlMs : 10 * 60 * 1000; // 10 mins
  const attemptsReset = opts.attemptsReset ?? true;

  const plainCode = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);

  this.otp = crypto.createHash("sha256").update(String(plainCode)).digest("hex");
  this.otpExpiresAt = new Date(Date.now() + ttlMs);
  
  if (attemptsReset) this.otpAttempts = 0;

  return plainCode;
};


userSchema.methods.verifyOtpCode = async function (plainCode, opts = {}) {
  const saveOnSuccess = opts.saveOnSuccess ?? true;
  const saveOnFailure = opts.saveOnFailure ?? true;
  const maxAttempts = typeof opts.maxAttempts === "number" ? opts.maxAttempts : 5;

  if (this.isVerified) {
    return { ok: true, reason: "already_verified", user: this };
  }

  if (!this.otp || !this.otpExpiresAt) {
    return { ok: false, reason: "no_otp" };
  }

  if (Date.now() > new Date(this.otpExpiresAt).getTime()) {
    this.clearOtp();
    if (saveOnFailure) await this.save();
    return { ok: false, reason: "expired" };
  }

  if (this.otpAttempts >= maxAttempts) {
    return { ok: false, reason: "max_attempts_exceeded" };
  }

  const hashedInput = crypto.createHash("sha256").update(String(plainCode)).digest("hex");
  const isMatch = hashedInput === this.otp;

  if (isMatch) {
    this.isVerified = true;
    this.clearOtp();
    if (saveOnSuccess) await this.save();
    return { ok: true, reason: "verified", user: this };
  } else {
    this.otpAttempts = (this.otpAttempts || 0) + 1;
    if (saveOnFailure) await this.save();
    
    const remaining = Math.max(0, maxAttempts - this.otpAttempts);
    return { ok: false, reason: "invalid_code", attempts: this.otpAttempts, remaining };
  }
};


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

userSchema.statics.clearExpiredOtps = async function () {
  const now = new Date();
  return this.updateMany(
    { otp: { $exists: true }, otpExpiresAt: { $lte: now } },
    { $unset: { otp: "", otpExpiresAt: "" }, $set: { otpAttempts: 0 } }
  );
};


export default mongoose.model("User", userSchema);