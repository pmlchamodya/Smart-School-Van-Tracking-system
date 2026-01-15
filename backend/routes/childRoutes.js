const express = require("express");
const router = express.Router();
const Child = require("../models/Child");

// 1. Route: Add Child
router.post("/add", async (req, res) => {
  const { parent_id, name, school, grade, pickupLocation, driver_id } =
    req.body;

  try {
    const newChild = new Child({
      parent_id,
      driver_id,
      name,
      school,
      grade,
      pickupLocation,
    });

    await newChild.save();
    res
      .status(201)
      .json({ message: "Child added successfully", child: newChild });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 2. Route: Get Children by Parent ID
router.get("/:parentId", async (req, res) => {
  try {
    const children = await Child.find({ parent_id: req.params.parentId });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// --- Get Children by Driver ID ---
// Endpoint: GET /api/children/driver/:driverId
router.get("/driver/:driverId", async (req, res) => {
  try {
    const children = await Child.find({ driver_id: req.params.driverId });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 3. Delete Child
router.delete("/:id", async (req, res) => {
  try {
    const child = await Child.findByIdAndDelete(req.params.id);
    if (!child) return res.status(404).json({ message: "Child not found" });
    res.json({ message: "Child removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// 4. Update Child Details & Status
router.put("/:id", async (req, res) => {
  try {
    const { name, school, grade, pickupLocation, status, driver_id } = req.body;

    const updatedChild = await Child.findByIdAndUpdate(
      req.params.id,
      { name, school, grade, pickupLocation, status, driver_id },
      { new: true }
    );

    if (!updatedChild)
      return res.status(404).json({ message: "Child not found" });
    res.json({ message: "Child updated successfully", child: updatedChild });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
