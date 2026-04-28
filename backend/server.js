const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

// Models
const cron = require("node-cron");
const Payment = require("./models/Payment");
const Child = require("./models/Child");

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

  // --- NEW: Join a specific room based on User ID ---
  socket.on("join", (userId) => {
    console.log(`User ${userId} joined their personal room`);
    socket.join(userId);
  });

  // --- NEW: Listen for notifications from Driver and send to specific Parent ---
  socket.on("notify_parent", (data) => {
    console.log("Notification sending to parent:", data.parentId);
    // Emit only to the specific parent's room
    io.to(data.parentId).emit("receive_notification", {
      title: data.title,
      message: data.message,
    });
  });

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

  // Listen for Payment Success Signals from Parents
  socket.on("paymentMade", (data) => {
    console.log("Payment received! Notifying driver ID:", data.driverId);
    // Send a signal ONLY to the specific driver to refresh their app
    io.emit(`refreshPayments_${data.driverId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// --- AUTOMATED MONTHLY BILL GENERATION (CRON JOB) ---
// This runs automatically at 12:00 AM on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  console.log("⏰ CRON JOB STARTED: Generating Monthly Bills...");
  try {
    const today = new Date();
    // Get current month in "YYYY-MM" format
    const currentMonth = today.toISOString().slice(0, 7);
    const DEFAULT_FEE = 5000;

    // Find all children who have a driver assigned
    const children = await Child.find({ driver_id: { $ne: null } });
    let createdCount = 0;

    for (const child of children) {
      // Check if a bill already exists for this month
      const existingPayment = await Payment.findOne({
        childId: child._id,
        month: currentMonth,
      });

      if (!existingPayment) {
        // Create new bill
        await Payment.create({
          childId: child._id,
          childName: child.name,
          parentId: child.parent_id,
          driverId: child.driver_id,
          month: currentMonth,
          amount: DEFAULT_FEE,
          status: "Pending",
        });
        createdCount++;
      }
    }
    console.log(
      `✅ CRON JOB SUCCESS: Generated ${createdCount} bills for ${currentMonth}`,
    );
  } catch (error) {
    console.error("❌ CRON JOB ERROR: Failed to generate bills", error);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
