const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

module.exports = { registerUser, authUser, getMe, adminAddDriver };
