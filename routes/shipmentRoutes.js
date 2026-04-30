const express = require("express");
const router = express.Router();

const Shipment = require("../models/Shipment");
const generateBarcode = require("../services/barcodeService");
const ScanEvent = require("../models/ScanEvent");
const { assignShipmentToDriver } = require("../services/assignmentService");

//creating a shipment. 
router.post("/shipment", async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    const trackingId = "TRK-" + Date.now();

    const barcodeUrl = generateBarcode(trackingId);

    const shipment = await Shipment.create({
      trackingId,
      sender,
      receiver,
      barcodeUrl
    });

    // Automatically assign to an available driver
    try {
      //assignmentResult contains the updated shipment and the assigned driver.
      const assignmentResult = await assignShipmentToDriver(shipment._id);
      
      res.status(201).json({
        message: "Shipment created and assigned to driver",
        shipment: assignmentResult.shipment,
        assignedDriver: {
          _id: assignmentResult.driver._id,
          name: assignmentResult.driver.name,
          email: assignmentResult.driver.email,
          phone: assignmentResult.driver.phone
        }
      });
    } catch (assignmentError) {
      // If no driver available, still create shipment in "booked" status
      res.status(201).json({
        message: "Shipment created but no driver available for assignment",
        shipment,
        warning: assignmentError.message
      });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//to get shipment details along with scan history using tracking id.
router.get("/track/:trackingId", async (req, res) => {
  try {
    const trackingId = req.params.trackingId.trim();

    //await is pauses execution until that particular thing is found. 
    const shipment = await Shipment.findOne({
      trackingId
    }).populate("assignedDriverId", "name phone vehicleType");
    //populate is used to fetch the driver details based on the assignedDriverId reference in the Shipment model. 

    const scans = await ScanEvent.find({
      trackingId
    }).sort({ scannedAt: 1 });
    //sorted by oldest to newest scan events.
    
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const bookedScan = {
      trackingId: shipment.trackingId,
      status: "booked",
      scannedAt: shipment.createdAt,
      location: null,
      isSystemEvent: true
    };

    res.json({
      shipment,
      scans: [bookedScan, ...scans]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;