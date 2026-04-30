import { useState } from "react";
import axios from "axios"; //axios is a library for making HTTP requests, used here to communicate with the backend API.
import "../styles/ScannedShipmentModal.css"; 

export default function ScannedShipmentModal({
  isOpen,
  shipment,
  driverId,
  onClose,
  onStatusUpdate
}) {
  const [updating, setUpdating] = useState(false); // State to track if a status update is in progress
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // State to hold success messages after status updates

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

  const getNextStates = () => {
    return validTransitions[shipment.status] || [];
  };

  //async as it involves waiting for API response and geolocation retrieval.
  //asycn functions allow us to write code that looks synchronous but can handle asynchronous operations.
  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const scanPayload = {
            trackingId: shipment.trackingId,
            driverId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            newStatus,
          };

          console.log("Sending scan request:", scanPayload);

          const response = await axios.post("http://localhost:5000/api/scan", scanPayload);

          console.log("Scan response:", response.data);

          // Update driver location
          await axios.put(`http://localhost:5000/api/driver/${driverId}/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });

          setSuccess(`Status updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
          
          // Close modal after 1.5 seconds
          setTimeout(() => {
            onStatusUpdate();
            setUpdating(false);
          }, 1500);

        } catch (err) {
          console.error("Scan error:", err.response?.data || err.message);
          const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update status: " + err.message;
          setError(errorMsg);
          setUpdating(false);
        }
      }, (err) => {
        console.error("Geolocation error:", err);
        setError("Unable to get location. Please enable location services.");
        setUpdating(false);
      });

    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An error occurred: " + err.message);
      setUpdating(false);
    }
  };

  if (!isOpen || !shipment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "booked":
        return "#FFB800";
      case "picked_up":
        return "#8979f5";
      case "assigned":
        return "#0066CC";
      case "in_transit":
        return "#1F77D2";
      case "out_for_delivery":
        return "#FF6B35";
      case "delivered":
        return "#06A77D";
      case "failed":
        return "#D32F2F";
      default:
        return "#666";
    }
  };

  return (
    <div className="scanned-shipment-overlay" onClick={onClose}>
      <div className="scanned-shipment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shipment-modal-header">
          <h2>Delivery Package</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="shipment-modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Tracking ID */}
          <div className="modal-section">
            <h3>Tracking ID</h3>
            <p className="tracking-id-display">{shipment.trackingId}</p>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(shipment.status) }}
            >
              {shipment.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          {/* Receiver Details */}
          <div className="modal-section">
            <h3>📍 Delivery To</h3>
            <div className="detail-box">
              <p className="detail-label">Name</p>
              <p className="detail-value">{shipment.receiver.name}</p>

              <p className="detail-label">Phone</p>
              <p className="detail-value">{shipment.receiver.phone}</p>

              <p className="detail-label">Address</p>
              <p className="detail-value">{shipment.receiver.address}</p>
            </div>
          </div>

          {/* Sender Details */}
          <div className="modal-section">
            <h3>📦 From</h3>
            <div className="detail-box">
              <p className="detail-label">Name</p>
              <p className="detail-value">{shipment.sender.name}</p>

              <p className="detail-label">Phone</p>
              <p className="detail-value">{shipment.sender.phone}</p>
            </div>
          </div>

          {/* Status Update Actions */}
          {getNextStates().length > 0 && (
            <div className="modal-section action-section">
              <h3>Update Status</h3>
              <div className="button-group">
                {getNextStates().map((nextStatus) => {
                  const getButtonStyle = (status) => {
                    if (status === "picked_up") return "pickup-btn";
                    if (status === "in_transit") return "transit-btn";
                    if (status === "out_for_delivery") return "out-delivery-btn";
                    if (status === "delivered") return "delivered-btn";
                    if (status === "failed") return "failed-btn";
                    return "default-btn";
                  };

                  const getButtonLabel = (status) => {
                    if (status === "picked_up") return "📦 Picked Up";
                    if (status === "in_transit") return " In Transit";
                    if (status === "out_for_delivery") return " Out for Delivery";
                    if (status === "delivered") return "✓ Delivered";
                    if (status === "failed") return "✗ Failed";
                    return status.replace(/_/g, " ").toUpperCase();
                  };

                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusUpdate(nextStatus)}
                      disabled={updating}
                      className={`action-btn ${getButtonStyle(nextStatus)}`}
                    >
                      {updating ? "Updating..." : getButtonLabel(nextStatus)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="shipment-modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
