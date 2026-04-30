const mongoose = require("mongoose");

const ScanEventSchema = new mongoose.Schema({
  trackingId: { type: String, required: true },
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Driver", 
    required: true 
  },

  location: {
    lat: Number,
    lng: Number
  },

  status: {
    type: String,
    enum: ["booked", "assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"],
    required: true
  },

  scannedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("ScanEvent", ScanEventSchema);