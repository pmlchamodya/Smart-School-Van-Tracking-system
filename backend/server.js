const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

// Route Imports
const userRoutes = require("./routes/userRoutes");
const childRoutes = require("./routes/childRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Configs
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Simple Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/children", childRoutes);
app.use("/api/payments", paymentRoutes);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New user connected", socket.id);
  socket.on("sendLocation", (data) => {
    console.log("Location received:", data);
    io.emit(`receiveLocation_${data.driverId}`, data);
  });

  // Attendance Update Signal
  socket.on("attendanceUpdated", (data) => {
    console.log("Attendance updated! Notifying driver:", data.driverId);
    io.emit(`refreshDriver_${data.driverId}`);
  });

  // Journey Ended Signal
  socket.on("journeyEnded", (data) => {
    console.log("Journey ended for driver:", data.driverId);
    // Notify the parent app that the journey has ended
    io.emit(`journeyEnded_${data.driverId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
