const express = require("express");
const router = express.Router();
const Child = require("../models/Child");
const Payment = require("../models/Payment");

// 1. Route: Add Child
router.post("/add", async (req, res) => {
  // FIXED: Added 'location' to destructuring
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
      location, // FIXED: Ensure exact GPS coordinates are saved
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
    // FIXED: Added 'location' to destructuring
    const { name, school, grade, pickupLocation, status, driver_id, location } =
      req.body;

    // 1. Check if child exists
    const existingChild = await Child.findById(req.params.id);
    if (!existingChild)
      return res.status(404).json({ message: "Child not found" });

    // 2. Update the child's basic details
    let updateData = { name, school, grade, pickupLocation };

    // FIXED: Only update location if it is provided
    if (location) {
      updateData.location = location;
    }

    // FIXED: Only update status if it is provided
    if (status) {
      updateData.status = status;
    }

    // FIXED: Securely update driver without accidentally removing it
    if (driver_id !== undefined) {
      updateData.driver_id = driver_id;

      // If driver is being newly assigned, set the driverAssignedAt timestamp
      if (driver_id && !existingChild.driver_id) {
        updateData.driverAssignedAt = new Date();
      }
    }

    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    res.json({ message: "Child updated successfully", child: updatedChild });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 6. Route: Update Child's Attendance
// Endpoint: PUT /api/children/attendance/:id
router.put("/attendance/:id", async (req, res) => {
  try {
    const { isAbsent } = req.body;

    // Find the child and update the 'isAbsent' status
    // Also reset 'status' to 'safe' when attendance changes
    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      {
        isAbsent: isAbsent,
        status: "safe",
      },
      { new: true },
    );

    if (!updatedChild) {
      return res.status(404).json({ message: "Child not found" });
    }

    res.json({
      message: "Attendance updated successfully",
      child: updatedChild,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
