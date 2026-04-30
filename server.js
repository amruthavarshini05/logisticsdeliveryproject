const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
// Importing the Mongoose models, allows us to interact with the corresponding collections in MongoDB.
//cors is used to enable cross-origin requests, allowing the frontend (which may be on a different domain or port) to communicate with this backend API.
//dotenv is used to load environment variables from a .env file, which is a common practice for managing configuration settings like database connection strings and API keys without hardcoding them in the source code.

//imported for testing
const Shipment = require("./models/Shipment");
const Driver = require("./models/Driver");
const ScanEvent = require("./models/ScanEvent");

const shipmentRoutes = require("./routes/shipmentRoutes");
const scanRoutes = require("./routes/scanRoutes");
const driverRoutes = require("./routes/driverRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", shipmentRoutes);
app.use("/api", scanRoutes);
app.use("/api", driverRoutes);
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API Running");
});

//listening on the port specified in the environment variable PORT, which is typically set to 5000 for development.
app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});