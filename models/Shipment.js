const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, required: true },

  status: {
    type: String,
    enum: ["booked", "assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"],
    default: "booked"
  },

  sender: {
    name: String,
    phone: String,
    email: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
    address: String // legacy field for backward compatibility
  },

  receiver: {
    name: String,
    phone: String,
    email: String,
    street: String,
    city: String,
    postalCode: String,
    country: String,
    address: String // legacy field for backward compatibility
  },

  assignedDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },

  barcodeUrl: String

}, { timestamps: true });
//timestamps will automatically add createdAt and updatedAt fields to the schema

module.exports = mongoose.model("Shipment", ShipmentSchema);
//exports the Shipment model based on the ShipmentSchema, allowing us to interact with the shipments collection in MongoDB.