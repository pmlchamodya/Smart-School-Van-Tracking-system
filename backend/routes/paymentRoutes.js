const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Child = require("../models/Child");

// 1. Generate Monthly Fees (Can be run by Admin or a Scheduler)
// P.S: Ideally, this should run automatically on the 1st of every month using a cron job.
// For now, we make a manual route to test it.
router.post("/generate-monthly", async (req, res) => {
  try {
    const { month, defaultFee } = req.body; // e.g., month: "2026-04", defaultFee: 5000

    if (!month || !defaultFee) {
      return res
        .status(400)
        .json({ message: "Month and default fee are required" });
    }

    // Find all children who have an assigned driver
    const children = await Child.find({ driver_id: { $ne: null } });
    let createdCount = 0;

    for (const child of children) {
      // Check if a payment record already exists for this child and this month
      const existingPayment = await Payment.findOne({
        childId: child._id,
        month: month,
      });

      if (!existingPayment) {
        // Create a new 'Pending' payment record
        await Payment.create({
          childId: child._id,
          childName: child.name,
          parentId: child.parent_id,
          driverId: child.driver_id,
          month: month,
          amount: defaultFee, // We can customize this per child later if needed
          status: "Pending",
        });
        createdCount++;
      }
    }

    res.status(200).json({
      message: `Successfully generated ${createdCount} new bills for ${month}.`,
    });
  } catch (error) {
    console.error("Error generating fees:", error);
    res.status(500).json({ message: "Server error generating fees" });
  }
});

// 2. Mark a Payment as Paid
router.put("/mark-paid/:paymentId", async (req, res) => {
  try {
    const { paymentMethod } = req.body; // e.g., "Cash", "Card"

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    payment.status = "Paid";
    payment.paymentMethod = paymentMethod || "Cash";
    payment.paidAt = new Date(); // Sets current date and time

    await payment.save();

    res
      .status(200)
      .json({ message: "Payment successfully marked as Paid!", payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Server error updating payment" });
  }
});

// 3. Get Payments for a Driver (Filter by Month)
router.get("/driver/:driverId/:month", async (req, res) => {
  try {
    const { driverId, month } = req.params;

    // Fetch payments and 'populate' child and parent details to show names in the app
    const payments = await Payment.find({ driverId, month })
      .populate("childId", "name school") // Get child's name and school
      .populate("parentId", "name phoneNumber"); // Get parent's name and number

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching driver payments:", error);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});

// 4. Get Payments for a Parent (All months)
router.get("/parent/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;
    // Get all payments for this parent, sorted by newest first
    const payments = await Payment.find({ parentId: parentId })
      .populate("childId", "name school")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching parent payments:", error);
    res.status(500).json({ message: "Server error fetching payments" });
  }
});

module.exports = router;
