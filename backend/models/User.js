const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    // --- Basic User Info ---
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    fcmToken: { type: String, default: null },
    role: {
      type: String,
      enum: ["admin", "driver", "parent"],
      default: "parent",
    },
    resetOTP: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },

    // --- Personal Details (Common) ---
    phone: { type: String },
    birthday: { type: String },
    gender: { type: String },
    profileImage: { type: String },

    // --- Parent Specific Details ---
    address: { type: String },
    emergencyContact: { type: String },

    // --- NEW: Expo Push Token for Background Notifications ---
    // This will store the Expo Push Token for the user, allowing us to send them notifications even when the app is closed.
    pushToken: { type: String, default: null },

    // --- Driver Specific Identification ---
    nic: { type: String },
    licenseNumber: { type: String },

    createdAt: { type: Date, default: Date.now },

    // --- Driver: Vehicle & Route Details ---
    vanDetails: {
      vehicleNo: { type: String },
      seats: { type: Number, default: 0 },
      model: { type: String },
    },
    routeDetails: {
      startLocation: String,
      endLocation: String,
      startTime: String,
      duration: String,

      schools: [String],
      cities: [String],
    },

    // --- Parent: Linked Children ---
    children: [
      {
        studentName: String,
        studentId: String,
      },
    ],
    // Add these fields to the userSchema inside User.js
    resetOTP: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Middleware: Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: Verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
