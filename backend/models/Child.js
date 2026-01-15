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
  status: {
    type: String,
    enum: ["safe", "in-van", "school", "dropped"],
    default: "safe",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Child", ChildSchema);
