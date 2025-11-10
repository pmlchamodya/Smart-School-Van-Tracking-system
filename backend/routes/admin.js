const express = require("express");
const router = express.Router();

// This is a test route
// Access it via: GET http://<your-ip>:5000/api/admin/data
router.get("/data", (req, res) => {
  res.status(200).send({ message: "This is secure data for ADMINS only" });
});

// We can add routes to get all drivers, all parents, etc.
// router.get('/users', getAllUsers);

module.exports = router;
