const express = require("express");
const router = express.Router();
const { registerUser, authUser } = require("../controllers/userController");
const User = require("../models/User");
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
      { new: true }
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

module.exports = router;
