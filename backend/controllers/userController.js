const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Generate JWT Token using the secret from .env
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Standard user registration (Parents and Drivers can self-register)
const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber, role } = req.body;
  try {
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: "Email already registered" });

    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists)
      return res.status(400).json({ message: "Phone number already in use" });

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user and assign token
const authUser = async (req, res) => {
  const { identifier, password, fcmToken } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (user && (await user.matchPassword(password))) {
      // Update FCM Token if provided from the mobile device
      if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email/phone or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the profile data of the currently logged-in user
const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phoneNumber: req.user.phoneNumber,
    role: req.user.role,
  });
};

// Admin manually adding a driver with full van details from the dashboard
const adminAddDriver = async (req, res) => {
  const { name, email, password, phoneNumber, vehicleNo, seats, routes } =
    req.body;
  try {
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: "Email already registered" });

    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists)
      return res.status(400).json({ message: "Phone number already in use" });

    // Format Routes string into an Array
    let formattedRoutes = [];
    if (routes)
      formattedRoutes = routes.split(",").map((route) => route.trim());

    // Create the Driver User with Van Details
    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      role: "driver",
      vanDetails: {
        vehicleNo: vehicleNo || "",
        seats: seats ? parseInt(seats) : 0,
        routes: formattedRoutes,
      },
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vanDetails: user.vanDetails,
        message: "Driver added successfully",
      });
    } else {
      res.status(400).json({ message: "Invalid driver data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send 6-digit OTP to user's email for password reset
// @route   POST /api/users/send-otp
const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    // Generate a secure 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes) to user record
    user.resetOTP = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Email content with OTP code
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #2563EB; text-align: center;">Verification Code</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Use the following OTP to verify your account:</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px;">
          <h1 style="letter-spacing: 10px; color: #1e40af; margin: 0;">${otp}</h1>
        </div>
        <p style="margin-top: 15px; color: #666;">This code is valid for 10 minutes only. If you did not request this, please ignore this email.</p>
      </div>
    `;

    // Send the OTP email using the sendEmail utility
    await sendEmail({
      email: email,
      subject: "Password Reset Verification Code",
      html: emailHtml,
    });

    res.status(200).json({ message: "OTP sent successfully to your email" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP. Check email settings." });
  }
};

// @desc    Verify OTP and update user's password
// @route   POST /api/users/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Check for user with matching email, OTP, and valid expiration date
    const user = await User.findOne({
      email,
      resetOTP: otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP code" });
    }

    // Update the password (hashed via pre-save middleware in User model)
    user.password = newPassword;

    // Clear the OTP fields after successful reset
    user.resetOTP = null;
    user.otpExpires = null;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred during password reset" });
  }
};

module.exports = {
  registerUser,
  authUser,
  getMe,
  adminAddDriver,
  sendOTP,
  resetPassword,
};
