const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const Shipment = require("../models/Shipment");

//bcrypt for password hashing.
const bcrypt = require("bcryptjs");
//this function hashes the password before saving it to db. 10 is number of hashing rounds
const hashPassword = async (pwd) => {
  return await bcrypt.hash(pwd, 10);
};
//this function compares the provided password with the hashed password in db.
const verifyPassword = async (pwd, hash) => {
  return await bcrypt.compare(pwd, hash);
};

// Driver Registration
router.post("/driver/register", async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType, driverLicense} = req.body;

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await hashPassword(password);

    const driver = await Driver.create({
      name,
      email,
      phone,
      password: hashedPassword,
      vehicleType,
      driverLicense,
      isAvailable: true,
      assignedShipments: []
    });

    res.status(201).json({
      message: "Driver registered successfully",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        driverLicense: driver.driverLicense,
        isAvailable: driver.isAvailable,
        assignedShipments: driver.assignedShipments
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver Login
router.post("/driver/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const isPasswordValid = verifyPassword(password, driver.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        driverLicense: driver.driverLicense,
        isAvailable: driver.isAvailable,
        currentLocation: driver.currentLocation
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver assignments
router.get("/driver/:driverId/assignments", async (req, res) => {
  try {
    const shipments = await Shipment.find({
      assignedDriverId: req.params.driverId
    });

    res.json(shipments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver availability
router.put("/driver/:driverId/availability", async (req, res) => {
  try {
    const { isAvailable } = req.body;

    //the new true is there so that the updated driver document is returned and not old unupdated one.
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { isAvailable },
      { new: true }
    );

    res.json({
      message: "Availability updated",
      driver
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver location
router.put("/driver/:driverId/location", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { 
        currentLocation: { lat, lng }
      },
      { new: true }
    );

    res.json({
      message: "Location updated",
      driver
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;