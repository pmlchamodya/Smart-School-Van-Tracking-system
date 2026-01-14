const express = require("express");
const router = express.Router();
const { registerUser, authUser } = require("../controllers/userController");

// Define the registration route
router.post("/register", registerUser);

// Define the login route
router.post("/login", authUser);

module.exports = router;
