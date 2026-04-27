const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Child = require("../models/Child");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// 1. Generate Monthly Fees
// Automatically creates pending bills for all children with an assigned driver
router.post("/generate-monthly", async (req, res) => {
  try {
    const { month, defaultFee } = req.body;

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
          amount: defaultFee,
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

// 2. Mark a Payment as Paid & Send E-Receipt
router.put("/mark-paid/:paymentId", async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // Find the payment and populate parent details to fetch the email address
    const payment = await Payment.findById(req.params.paymentId).populate(
      "parentId",
    );
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    // Update payment status and details
    payment.status = "Paid";
    payment.paymentMethod = paymentMethod || "Cash";
    payment.paidAt = new Date();

    await payment.save();

    // --- Send E-Receipt via Email ---
    if (payment.parentId && payment.parentId.email) {
      const parentName = payment.parentId.name;
      const parentEmail = payment.parentId.email;

      const receiptHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
          <h2 style="color: #2563EB; text-align: center;">Payment Receipt</h2>
          <p>Dear <strong>${parentName}</strong>,</p>
          <p>Thank you for your payment. Here are your transaction details:</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Student Name:</strong> ${payment.childName}</li>
            <li style="margin-bottom: 10px;"><strong>Month:</strong> ${payment.month}</li>
            <li style="margin-bottom: 10px;"><strong>Amount Paid:</strong> Rs. ${payment.amount}</li>
            <li style="margin-bottom: 10px;"><strong>Payment Method:</strong> ${payment.paymentMethod}</li>
            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${payment.paidAt.toLocaleString()}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; color: #10B981; font-weight: bold;">Status: PAID ✅</p>
          <p style="font-size: 12px; color: #888; text-align: center;">This is an automatically generated e-receipt from the Smart School Van System.</p>
        </div>
      `;

      sendEmail({
        email: parentEmail,
        subject: `Payment Receipt - ${payment.childName} (${payment.month})`,
        html: receiptHTML,
      });
    }

    res.status(200).json({
      message: "Payment successfully marked as Paid and receipt sent!",
      payment,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Server error updating payment" });
  }
});

// 3. Get Payments for a Driver (Filter by Month)
router.get("/driver/:driverId/:month", async (req, res) => {
  try {
    const { driverId, month } = req.params;

    // Fetch payments and populate child and parent details for the frontend
    const payments = await Payment.find({ driverId, month })
      .populate("childId", "name school")
      .populate("parentId", "name phoneNumber");

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
