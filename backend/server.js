// server.js (UPDATED)

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// --- 1. Initialize Firebase Admin ---
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- 2. Create Express App ---
const app = express();

// --- 3. Apply Middleware ---
app.use(cors()); // Allows requests from your React Native app
app.use(express.json()); // Allows the server to understand JSON data

// --- 4. IMPORT AND USE ALL ROUTES ---

// Import all route files
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin"); // <-- Added this
const driverRoutes = require("./routes/driver"); // <-- Added this
const parentRoutes = require("./routes/parent"); // <-- Added this

// Tell the app to use these routes with their base URLs
app.use("/api/auth", authRoutes); // e.g., /api/auth/register
app.use("/api/admin", adminRoutes); // e.g., /api/admin/data
app.use("/api/driver", driverRoutes); // e.g., /api/driver/data
app.use("/api/parent", parentRoutes); // e.g., /api/parent/data

// --- 5. Define a Test Route ---
// (This is good for checking if the server is running)
app.get("/", (req, res) => {
  res.status(200).send("Backend server is live and connected to Firebase!");
});

// --- 6. Start the Server ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
