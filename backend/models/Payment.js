const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // --- Which child is this for? ---
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    // --- Who is paying? (Parent) ---
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // --- Who is receiving the money? (Driver) ---
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // --- Which month is this fee for? (Format: "YYYY-MM" eg: "2026-04") ---
    month: {
      type: String,
      required: true,
    },
    // --- Fee Amount ---
    amount: {
      type: Number,
      required: true,
    },
    // --- Payment Status ---
    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending", // Automatically starts as Unpaid
    },
    // --- How they paid (Updated later when paying) ---
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "None"],
      default: "None",
    },
    // --- Exact Date and Time of Payment ---
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }, // Auto creates createdAt and updatedAt
);

module.exports = mongoose.model("Payment", paymentSchema);
