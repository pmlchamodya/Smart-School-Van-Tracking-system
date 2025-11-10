const express = require("express");
const router = express.Router();

// This is a test route
// Access it via: GET http://<your-ip>:5000/api/driver/data
router.get("/data", (req, res) => {
  res.status(200).send({ message: "This is secure data for DRIVERS only" });
});

// We will add routes for updating location, etc.
// router.post('/update-location', updateDriverLocation);

module.exports = router;
