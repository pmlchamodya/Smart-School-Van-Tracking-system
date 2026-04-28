const express = require("express");
const router = express.Router();
const { registerUser, authUser } = require("../controllers/userController");
const User = require("../models/User");
const Child = require("../models/Child");
const bcrypt = require("bcryptjs");

// --- Register a new user ---
router.post("/register", registerUser);

// --- Login & Authenticate ---
router.post("/login", authUser);

// --- Get User Profile ---
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// --- Update User Profile (General Info) ---
router.put("/update/:id", async (req, res) => {
  try {
    // Destructure all possible fields
    const {
      name,
      email,
      phoneNumber,
      birthday,
      gender,
      profileImage,
      address,
      emergencyContact,
      nic,
      licenseNumber,
      vanDetails,
      routeDetails,
    } = req.body;

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phoneNumber,
        birthday,
        gender,
        profileImage,
        address,
        emergencyContact,
        nic,
        licenseNumber,
        vanDetails,
        routeDetails,
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Update failed", error });
  }
});

// --- Change Password Route ---
router.put("/change-password/:id", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Verify Current Password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // 2. Set New Password
    // The pre('save') hook in User.js will automatically encrypt this
    user.password = newPassword;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password Update Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// --- Get Drivers with Seat Availability ---
router.get("/drivers/search", async (req, res) => {
  try {
    // 1. Find all users who are drivers
    const drivers = await User.find({ role: "driver" }).select("-password");

    // 2. Calculate seat availability for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        // Count how many children are assigned to this driver
        const currentStudentCount = await Child.countDocuments({
          driver_id: driver._id,
        });

        // Get total seats from driver details (Default to 0 if not set)
        const totalSeats = driver.vanDetails?.seats || 0;

        // Calculate remaining seats
        const availableSeats = totalSeats - currentStudentCount;

        // Return driver object with extra stats
        return {
          ...driver.toObject(),
          currentStudentCount,
          availableSeats: availableSeats > 0 ? availableSeats : 0,
          isFull: availableSeats <= 0,
        };
      }),
    );

    res.json(driversWithStats);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// --- NEW: Save Expo Push Token ---
router.put("/update-token", async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res
        .status(400)
        .json({ message: "User ID and Push Token are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: pushToken },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Push token saved successfully" });
  } catch (error) {
    console.error("Error saving push token:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin Dashboard Statistics ---
// Get total counts for Drivers, Parents, Students, and Vehicles
router.get("/admin/stats", async (req, res) => {
  try {
    // 1. Get total number of Drivers
    const totalDrivers = await User.countDocuments({ role: "driver" });

    // 2. Get total number of Parents
    const totalParents = await User.countDocuments({ role: "parent" });

    // 3. Get total number of Students (Children)
    // For this, we count the total items in the Child collection
    const Child = require("../models/Child"); // Make sure Child model is imported if not already at the top
    const totalStudents = await Child.countDocuments();

    // 4. Get active vans (Assuming every driver has a van)
    // You can customize this if you have a separate vehicle logic
    const activeVans = totalDrivers;

    res.json({
      driversCount: totalDrivers,
      parentsCount: totalParents,
      studentsCount: totalStudents,
      vansCount: activeVans,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin - Manage Drivers APIs ---
// 1. Get All Drivers
router.get("/admin/drivers", async (req, res) => {
  try {
    // Fetch all users where role is 'driver', excluding their passwords for security
    const drivers = await User.find({ role: "driver" }).select("-password");
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. Delete a Driver
router.delete("/admin/drivers/:id", async (req, res) => {
  try {
    const driverId = req.params.id;
    await User.findByIdAndDelete(driverId);
    res.json({ message: "Driver removed successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin - Get All Parents ---
router.get("/admin/parents", async (req, res) => {
  try {
    // Fetch all users where role is 'parent', excluding their passwords
    const parents = await User.find({ role: "parent" }).select("-password");
    res.json(parents);
  } catch (error) {
    console.error("Error fetching parents:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin - Delete a Parent ---
router.delete("/admin/parents/:id", async (req, res) => {
  try {
    const parentId = req.params.id;
    // Find the parent by ID and delete from the database
    await User.findByIdAndDelete(parentId);
    res.json({ message: "Parent removed successfully" });
  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin - Get All Students ---
router.get("/admin/students", async (req, res) => {
  try {
    const Child = require("../models/Child"); // Ensure Child model is imported

    // Fetch all children and also grab their parent's and driver's basic info
    const students = await Child.find()
      .populate("parent_id", "name phoneNumber")
      .populate("driver_id", "name vanDetails");

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- NEW: Admin - Delete a Student ---
router.delete("/admin/students/:id", async (req, res) => {
  try {
    const Child = require("../models/Child");
    const studentId = req.params.id;

    await Child.findByIdAndDelete(studentId);
    res.json({ message: "Student removed successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
