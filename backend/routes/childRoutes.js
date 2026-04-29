const express = require("express");
const router = express.Router();
const Child = require("../models/Child");
const Payment = require("../models/Payment");
const User = require("../models/User");
const admin = require("firebase-admin");

// 1. Route: Add Child
router.post("/add", async (req, res) => {
  const {
    parent_id,
    name,
    school,
    grade,
    pickupLocation,
    location,
    driver_id,
  } = req.body;

  try {
    const newChild = new Child({
      parent_id,
      driver_id,
      name,
      school,
      grade,
      pickupLocation,
      location,
    });

    await newChild.save();
    res
      .status(201)
      .json({ message: "Child added successfully", child: newChild });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 2. Route: Get Children by Parent ID
router.get("/:parentId", async (req, res) => {
  try {
    const children = await Child.find({ parent_id: req.params.parentId });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 3. Route: Get Children by Driver ID
// Endpoint: GET /api/children/driver/:driverId
router.get("/driver/:driverId", async (req, res) => {
  try {
    const children = await Child.find({ driver_id: req.params.driverId });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 4. Route: Delete Child (With Pro-rata Final Settlement Logic)
router.delete("/:id", async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) return res.status(404).json({ message: "Child not found" });

    // --- Pro-Rata Billing Logic ---
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // e.g., "2026-04"

    // 1. Check for ANY existing pending bills from PAST months
    const pastPendingBills = await Payment.find({
      childId: child._id,
      status: "Pending",
      month: { $ne: currentMonth }, // Any month other than the current one
    });

    if (pastPendingBills.length > 0) {
      return res.status(400).json({
        message:
          "Cannot remove child. Please settle past pending payments first.",
      });
    }

    // 2. Calculate Pro-rata for the CURRENT month
    if (child.driver_id) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const joinDate = new Date(child.driverAssignedAt || child.createdAt);

      // If joined this month, start from joinDate. Else, start from monthStart.
      const calculationStartDate =
        joinDate > monthStart ? joinDate : monthStart;

      // Calculate days used
      const diffTime = Math.abs(today - calculationStartDate);
      let daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Minimum 1 day charge
      if (daysUsed === 0) {
        daysUsed = 1;
      }

      const DEFAULT_MONTHLY_FEE = 5000;
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();

      // Calculate the exact amount for days used
      let proRataAmount = Math.round(
        (DEFAULT_MONTHLY_FEE / daysInMonth) * daysUsed,
      );
      if (proRataAmount < 0) proRataAmount = 0;
      if (proRataAmount > DEFAULT_MONTHLY_FEE)
        proRataAmount = DEFAULT_MONTHLY_FEE;

      // Check if a bill already exists for the current month
      const currentMonthBill = await Payment.findOne({
        childId: child._id,
        month: currentMonth,
      });

      if (currentMonthBill) {
        if (currentMonthBill.status === "Pending") {
          // Update the existing pending bill to the exact pro-rata amount
          currentMonthBill.amount = proRataAmount;
          await currentMonthBill.save();

          return res.status(400).json({
            message: `Final settlement of Rs. ${proRataAmount} is pending for the ${daysUsed} days used this month. Please go to Payments to settle it before removing.`,
          });
        }
        // If status is "Paid", they already paid for the month. We can let them delete.
      } else {
        // Create a new final settlement bill IF days used > 0
        if (daysUsed > 0 && proRataAmount > 0) {
          await Payment.create({
            childId: child._id,
            childName: child.name,
            parentId: child.parent_id,
            driverId: child.driver_id,
            month: currentMonth,
            amount: proRataAmount,
            status: "Pending",
          });

          return res.status(400).json({
            message: `A final settlement bill of Rs. ${proRataAmount} has been generated for the ${daysUsed} days used this month. Please pay it in the Payments section before removing.`,
          });
        }
      }
    }

    // 3. If no bills pending and no pro-rata owed, delete safely
    await Child.findByIdAndDelete(req.params.id);
    res.json({ message: "Child removed successfully" });
  } catch (error) {
    console.error("Delete Child Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// 5. Route: Update Child Details & Status
router.put("/:id", async (req, res) => {
  try {
    const { name, school, grade, pickupLocation, status, driver_id, location } =
      req.body;

    const existingChild = await Child.findById(req.params.id);
    if (!existingChild)
      return res.status(404).json({ message: "Child not found" });

    let updateData = { name, school, grade, pickupLocation };

    if (location) {
      updateData.location = location;
    }

    if (status) {
      updateData.status = status;
    }

    if (driver_id !== undefined) {
      updateData.driver_id = driver_id;
      if (driver_id && !existingChild.driver_id) {
        updateData.driverAssignedAt = new Date();
      }
    }

    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    // --- NEW: Send Firebase Push Notification when Status Changes ---
    if (status && existingChild.status !== status) {
      try {
        const parent = await User.findById(existingChild.parent_id);

        if (parent && parent.fcmToken) {
          let title = "Van Status Update";
          let message = `Status changed to ${status}.`;

          if (status === "in-van") {
            title = "Child Picked Up! 🚐";
            message = `${existingChild.name} has safely boarded the van.`;
          } else if (status === "school") {
            title = "Dropped at School! 🏫";
            message = `${existingChild.name} has been dropped off at school.`;
          } else if (status === "safe") {
            title = "Safely Home! 🏡";
            message = `${existingChild.name} has been dropped off at home safely.`;
          }

          const fcmMessage = {
            notification: {
              title: title,
              body: message,
            },
            token: parent.fcmToken,
          };

          await admin.messaging().send(fcmMessage);
          console.log(
            `FCM Notification sent to parent of ${existingChild.name}`,
          );
        }
      } catch (fcmError) {
        console.error("FCM Error:", fcmError);
      }
    }

    res.json({ message: "Child updated successfully", child: updatedChild });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 6. Route: Update Child's Attendance & Save to History
// Endpoint: PUT /api/children/attendance/:id
router.put("/attendance/:id", async (req, res) => {
  try {
    const { isAbsent } = req.body;
    const childId = req.params.id;

    // Get today's date and EXACT TIME
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Get formatted time (e.g., "07:30 AM")
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const attendanceStatus = isAbsent ? "Absent" : "Present";

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    // Update current status
    child.isAbsent = isAbsent;
    child.status = "safe";

    if (!child.attendanceHistory) {
      child.attendanceHistory = [];
    }

    const existingRecordIndex = child.attendanceHistory.findIndex(
      (record) => record.date === today,
    );

    if (existingRecordIndex !== -1) {
      // Update existing record for today AND update the time
      child.attendanceHistory[existingRecordIndex].status = attendanceStatus;
      child.attendanceHistory[existingRecordIndex].time = timeString;
    } else {
      // Add a new record with the TIME
      child.attendanceHistory.push({
        date: today,
        status: attendanceStatus,
        time: timeString,
      });
    }

    await child.save();

    // --- NEW: Send Firebase Push Notification for Attendance (Absent) ---
    if (isAbsent) {
      try {
        const parent = await User.findById(child.parent_id);
        if (parent && parent.fcmToken) {
          const fcmMessage = {
            notification: {
              title: "Attendance Update",
              body: `${child.name} has been marked as ABSENT for today.`,
            },
            token: parent.fcmToken,
          };
          await admin.messaging().send(fcmMessage);
          console.log(
            `FCM Notification (Absent) sent to parent of ${child.name}`,
          );
        }
      } catch (fcmError) {
        console.error("FCM Error (Absent):", fcmError);
      }
    }

    res.json({ message: "Attendance updated successfully", child });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// 7. Route: Get Monthly Attendance Report
// Endpoint: GET /api/children/attendance-report/:id/:month
router.get("/attendance-report/:id/:month", async (req, res) => {
  try {
    const childId = req.params.id;
    const month = req.params.month; // Expected Format: "YYYY-MM" (e.g. "2026-04")

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    const history = child.attendanceHistory || [];

    // Filter history to only include the requested month
    const monthlyRecords = history.filter((record) =>
      record.date.startsWith(month),
    );

    // Calculate totals
    const totalPresent = monthlyRecords.filter(
      (record) => record.status === "Present",
    ).length;
    const totalAbsent = monthlyRecords.filter(
      (record) => record.status === "Absent",
    ).length;

    res.json({
      month: month,
      totalPresent,
      totalAbsent,
      records: monthlyRecords.reverse(), // Reverse to show latest dates first
    });
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
