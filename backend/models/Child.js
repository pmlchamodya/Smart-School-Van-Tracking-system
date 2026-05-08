const mongoose = require("mongoose");

const ChildSchema = new mongoose.Schema({
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  driverAssignedAt: {
    type: Date,
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  pickupLocation: {
    type: String,
    required: false,
  },
  location: {
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
  },
  status: {
    type: String,
    enum: ["safe", "in-van", "school", "returning"],
    default: "safe",
  },
  isAbsent: {
    type: Boolean,
    default: false,
  },
  attendanceHistory: [
    {
      date: { type: String, required: true },
      status: { type: String, enum: ["Present", "Absent"], required: true },
      time: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Child", ChildSchema);
