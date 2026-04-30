const express = require("express");
const router = express.Router();

const Shipment = require("../models/Shipment");
const ScanEvent = require("../models/ScanEvent");
const { sendMilestoneNotifications } = require("../services/notificationService");

// Valid status transitions
const validTransitions = {
  booked: ["assigned"],
  assigned: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: []
};

// Validation function
const isValidTransition = (currentStatus, newStatus) => {
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Scan endpoint for drivers to update shipment status and location
router.post("/scan", async (req, res) => {
  try {
    const { trackingId, driverId, lat, lng, newStatus } = req.body;

    // Validate required fields
    if (!trackingId || !driverId || lat === undefined || lng === undefined || !newStatus) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["trackingId", "driverId", "lat", "lng", "newStatus"]
      });
    }

    const shipment = await Shipment.findOne({ trackingId });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    // Validate status transition
    if (!isValidTransition(shipment.status, newStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from '${shipment.status}' to '${newStatus}'`,
        currentStatus: shipment.status,
        allowedNextStates: validTransitions[shipment.status] || []
      });
    }

    // Create scan event with proper error handling
    let scan;
    try {
      scan = await ScanEvent.create({
        trackingId,
        driverId,
        location: {
          lat,
          lng
        },
        status: newStatus
      });
    } catch (scanError) {
      console.error("ScanEvent creation error:", scanError);
      return res.status(400).json({
        message: "Failed to create scan event",
        details: scanError.message
      });
    }

    // Update shipment
    try {
      shipment.status = newStatus;
      shipment.updatedAt = new Date();
      await shipment.save();
    } catch (shipmentError) {
      console.error("Shipment update error:", shipmentError);
      return res.status(400).json({
        message: "Failed to update shipment",
        details: shipmentError.message
      });
    }

    sendMilestoneNotifications(shipment, newStatus).catch((notificationError) => {
      console.log("Notification failed after scan:", notificationError.message);
    });

    res.json({
      message: "Scan successful",
      shipment,
      scan,
      allowedNextStates: validTransitions[newStatus] || []
    });

  } catch (error) {
    console.error("Scan endpoint error:", error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router;