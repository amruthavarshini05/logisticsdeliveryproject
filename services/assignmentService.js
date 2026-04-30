const Driver = require("../models/Driver");
const Shipment = require("../models/Shipment");

/**
 * Finds the most available driver (with fewest assignments)
 * and assigns a shipment to them
 */
async function assignShipmentToDriver(shipmentId) {
  try {
    // Get all available drivers sorted by number of assignments (ascending)
    const drivers = await Driver.find({ isAvailable: true })
      .exec();

    if (drivers.length === 0) {
      throw new Error("No available drivers");
    }

    // Find the driver with the fewest assignments
    //promise.all is used to wait for all the countDocuments operations to complete before proceeding.
    const driverAssignmentCounts = await Promise.all(
      drivers.map(async (driver) => {
        const count = await Shipment.countDocuments({
          assignedDriverId: driver._id
        });
        return { driver, count };
      })
    );

    // Sort by count and pick the one with least assignments
    driverAssignmentCounts.sort((a, b) => a.count - b.count);
    const selectedDriver = driverAssignmentCounts[0].driver;

    // Update the shipment with the assigned driver
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        assignedDriverId: selectedDriver._id,
        status: "assigned"
      },
      { new: true }
    );

    // Add shipment to driver's assignments
    selectedDriver.assignedShipments.push(shipmentId);
    await selectedDriver.save();

    return {
      shipment: updatedShipment,
      driver: selectedDriver
    };

  } catch (error) {
    throw new Error(`Assignment failed: ${error.message}`);
  }
}

module.exports = {
  assignShipmentToDriver
};