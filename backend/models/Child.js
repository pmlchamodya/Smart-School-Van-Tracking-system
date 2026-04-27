const mongoose = require("mongoose");

const ChildSchema = new mongoose.Schema({
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Link to Parent
  },
  // --- Link to Driver ---
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
    enum: ["safe", "in-van", "school", "dropped"],
    default: "safe",
  },
  isAbsent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Child", ChildSchema);
