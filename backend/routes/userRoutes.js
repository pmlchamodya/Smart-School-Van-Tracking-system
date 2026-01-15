const express = require("express");
const router = express.Router();
const { registerUser, authUser } = require("../controllers/userController");
const User = require("../models/User");

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

// --- Update User Profile (Parent & Driver) ---
router.put("/update/:id", async (req, res) => {
  try {
    // Destructure all possible fields from the request
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

module.exports = router;
