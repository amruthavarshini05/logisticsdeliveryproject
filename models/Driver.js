const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phone: String,
  password: {
    type: String,
    required: true,
  },
  vehicleType: String,
  driverLicense: String,

  currentLocation: {
    lat: Number,
    lng: Number
  },

  assignedShipments: [mongoose.Schema.Types.ObjectId],

  isAvailable: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Driver", DriverSchema);