const express = require("express");
const router = express.Router();
const {
  registerUser,
  authUser,
  getMe,
  adminAddDriver,
  sendOTP,
  resetPassword,
} = require("../controllers/userController");
const User = require("../models/User");
const Child = require("../models/Child");
const bcrypt = require("bcryptjs");

// Import Security Middlewares
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// --- Register a new user (Public) ---
router.post("/register", registerUser);

// --- Login & Authenticate (Public) ---
router.post("/login", authUser);

// --- OTP & Password Reset Routes (New) ---
router.post("/send-otp", sendOTP);
router.post("/reset-password", resetPassword);

// --- Get Current Logged In User Profile (Protected) ---
router.get("/me", protect, getMe);

// --- Admin Add Driver (Protected - Admin Only) ---
router.post(
  "/admin/add-driver",
  protect,
  authorizeRoles("admin"),
  adminAddDriver,
);

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
    const drivers = await User.find({ role: "driver" }).select("-password");

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const currentStudentCount = await Child.countDocuments({
          driver_id: driver._id,
        });

        const totalSeats = driver.vanDetails?.seats || 0;
        const availableSeats = totalSeats - currentStudentCount;

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

// --- Save Expo Push Token ---
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

// --- Admin Dashboard Statistics ---
router.get("/admin/stats", async (req, res) => {
  try {
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalParents = await User.countDocuments({ role: "parent" });
    const Child = require("../models/Child");
    const totalStudents = await Child.countDocuments();
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

// --- Admin - Manage Drivers APIs ---
router.get("/admin/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" }).select("-password");
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

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

// --- Admin - Get All Parents ---
router.get("/admin/parents", async (req, res) => {
  try {
    const parents = await User.find({ role: "parent" }).select("-password");
    res.json(parents);
  } catch (error) {
    console.error("Error fetching parents:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- Admin - Delete a Parent ---
router.delete("/admin/parents/:id", async (req, res) => {
  try {
    const parentId = req.params.id;
    await User.findByIdAndDelete(parentId);
    res.json({ message: "Parent removed successfully" });
  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- Admin - Get All Students ---
router.get("/admin/students", async (req, res) => {
  try {
    const Child = require("../models/Child");
    const students = await Child.find()
      .populate("parent_id", "name phoneNumber")
      .populate("driver_id", "name vanDetails");

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- Admin - Delete a Student ---
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
