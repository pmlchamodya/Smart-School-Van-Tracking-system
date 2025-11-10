const express = require("express");
const router = express.Router();

// This is a test route
// Access it via: GET http://<your-ip>:5000/api/parent/data
router.get("/data", (req, res) => {
  res.status(200).send({ message: "This is secure data for PARENTS only" });
});

// We will add routes for getting driver location, etc.
// router.get('/driver-location', getDriverLocation);

module.exports = router;
