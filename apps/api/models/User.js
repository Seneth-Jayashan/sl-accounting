import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

    password: { type: String, required: true, minlength: 6, select: false },

    role: { type: String, enum: ["admin", "student"], default: "student" },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },

    profileImage: { type: String, default: null },

    otp: { type: String },
    otpExpiresAt: { type: Date },

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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (err) {
    return next(err);
  }
});

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

  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);
