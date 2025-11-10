const express = require("express");
const router = express.Router();

// Import the register logic from our controller
const { registerUser } = require("../controllers/authController");

// Define the registration route
// This will respond to: POST http://localhost:5000/api/auth/register
router.post("/register", registerUser);

// You can add more auth routes here later (like /login)
// router.post("/login", loginUser);

module.exports = router;
