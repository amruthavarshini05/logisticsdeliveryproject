import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ScanModal from "../components/ScanModal";
import ScannedShipmentModal from "../components/ScannedShipmentModal";
import "../styles/DriverPage.css";

export default function DriverPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingShipmentId, setUpdatingShipmentId] = useState(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedShipment, setScannedShipment] = useState(null);
  const [isScannedShipmentModalOpen, setIsScannedShipmentModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(() => {
    const stored = localStorage.getItem("driverIsAvailable");
    return stored ? JSON.parse(stored) : true;
  });
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const driverId = localStorage.getItem("driverId");
  const driverName = localStorage.getItem("driverName");

  useEffect(() => {
    // Check if driver is logged in
    if (!driverId) {
      navigate("/driver/auth");
      return;
    }

    loadAssignments();
  }, [driverId, navigate]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/driver/${driverId}/assignments`
      );
      setShipments(res.data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to load assignments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = (foundShipment) => {
    setScannedShipment(foundShipment);
    setIsScanModalOpen(false);
    setIsScannedShipmentModalOpen(true);
  };

  const handleScannedShipmentModalClose = () => {
    setIsScannedShipmentModalOpen(false);
    setScannedShipment(null);
  };

  const handleScannedStatusUpdate = async () => {
    await loadAssignments();
    handleScannedShipmentModalClose();
  };

  const updateStatus = async (trackingId, newStatus) => {
    setUpdatingShipmentId(trackingId);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await axios.post("http://localhost:5000/api/scan", {
          trackingId,
          driverId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          newStatus,
        });

        // Update driver location
        await axios.put(`http://localhost:5000/api/driver/${driverId}/location`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });

        loadAssignments();
        setUpdatingShipmentId(null);
      });
    } catch (error) {
      setErrorMessage("Failed to update status: " + error.message);
      setUpdatingShipmentId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("driverId");
    localStorage.removeItem("driverName");
    localStorage.removeItem("driverEmail");
    localStorage.removeItem("driverLicense");
    localStorage.removeItem("driverIsAvailable");
    navigate("/driver/auth");
  };

  const toggleAvailability = async () => {
    setUpdatingAvailability(true);
    try {
      const newAvailability = !isAvailable;
      const res = await axios.put(
        `http://localhost:5000/api/driver/${driverId}/availability`,
        { isAvailable: newAvailability }
      );
      setIsAvailable(newAvailability);
      localStorage.setItem("driverIsAvailable", JSON.stringify(newAvailability));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to update availability: " + error.message);
      console.error(error);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "booked":
        return "#FFB800";
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

  const simulateScan = () => {
    setIsScanModalOpen(true);
  };

  const manualScan = () => {
    const input = document.getElementById("manualScanInput");
    const trackingId = input?.value?.trim();
    if (!trackingId) {
      setErrorMessage("Please enter a tracking ID");
      return;
    }
    const foundShipment = shipments.find(s => s.trackingId === trackingId);
    if (foundShipment) {
      setScannedShipment(foundShipment);
      setIsScannedShipmentModalOpen(true);
      input.value = "";
    } else {
      setErrorMessage(`Shipment with tracking ID ${trackingId} not found`);
    }
  };

  const activeShipments = shipments.filter(s => s.status !== "delivered" && s.status !== "failed");
  const archivedShipments = shipments.filter(s => s.status === "delivered" || s.status === "failed");

 const openManifest = (item) => {
  const url =
    `http://localhost:8080/ParcelFlow/manifest.jsp` +
    `?trackingId=${encodeURIComponent(item.trackingId)}` +
    `&status=${encodeURIComponent(item.status)}` +
    `&driver=${encodeURIComponent(item.assignedDriverId || "Assigned Driver")}` +

    `&senderName=${encodeURIComponent(item.sender?.name || "")}` +
    `&senderPhone=${encodeURIComponent(item.sender?.phone || "")}` +
    `&senderEmail=${encodeURIComponent(item.sender?.email || "")}` +
    `&senderStreet=${encodeURIComponent(item.sender?.street || "")}` +
    `&senderCity=${encodeURIComponent(item.sender?.city || "")}` +
    `&senderPostalCode=${encodeURIComponent(item.sender?.postalCode || "")}` +
    `&senderCountry=${encodeURIComponent(item.sender?.country || "")}` +

    `&receiverName=${encodeURIComponent(item.receiver?.name || "")}` +
    `&receiverPhone=${encodeURIComponent(item.receiver?.phone || "")}` +
    `&receiverEmail=${encodeURIComponent(item.receiver?.email || "")}` +
    `&receiverStreet=${encodeURIComponent(item.receiver?.street || "")}` +
    `&receiverCity=${encodeURIComponent(item.receiver?.city || "")}` +
    `&receiverPostalCode=${encodeURIComponent(item.receiver?.postalCode || "")}` +
    `&receiverCountry=${encodeURIComponent(item.receiver?.country || "")}`;

  window.open(url, "_blank");
};

  if (loading) {
    return <div className="driver-page-loading">Loading assignments...</div>;
  }

  return (
    <div className="driver-page">
      {/* Header */}
      <div className="driver-header">
        <div className="driver-info">
          <h1>Driver Dashboard</h1>
          <p className="driver-name">Welcome, {driverName}</p>
        </div>
        <div className="header-actions">
          <button onClick={loadAssignments} className="refresh-button">
              Refresh
          </button>
          <button
            onClick={toggleAvailability}
            disabled={updatingAvailability}
            className={`availability-button ${isAvailable ? 'available' : 'unavailable'}`}
          >
            {updatingAvailability ? 'Updating...' : (isAvailable ? '✓ Available' : '✗ Unavailable')}
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Scanner Section */}
      <div className="dd-body">
        <div className="scanner-section">
          <h3>SCAN PACKAGE</h3>
          <div className="scanner-viewport" onClick={simulateScan} title="Tap to simulate scan">
            <div className="scanner-line"></div>
            <div className="scanner-icon">▦</div>
          </div>
        </div>
      </div>

      {/* Assignments Count */}
      <div className="assignments-count">
        <div className="count-header">
          <p>You have <strong>{activeShipments.length}</strong> active assignment(s)</p>
          {archivedShipments.length > 0 && (
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="archive-toggle"
            >
              {showArchived ? '← Back to Active' : `📦 View Archive (${archivedShipments.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Shipments List */}
      <div className="shipments-container">
        {showArchived ? (
          archivedShipments.length === 0 ? (
            <div className="no-assignments">
              <p>No completed deliveries</p>
            </div>
          ) : (
            archivedShipments.map((item) => (
              <div key={item._id} className="shipment-card archived">
                <div className="shipment-header">
                  <h3>{item.trackingId}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(item.status) }}
                  >
                    {item.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>

                <div className="shipment-details">
                  <div className="detail-section">
                    <h4>Receiver Details</h4>
                    <p><strong>Name:</strong> {item.receiver.name}</p>
                    <p><strong>Phone:</strong> {item.receiver.phone}</p>
                    <p><strong>Email:</strong> {item.receiver.email}</p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {[
                        item.receiver.street,
                        item.receiver.city,
                        item.receiver.country,
                        item.receiver.postalCode
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      </p>
                    </div>

                  <div className="detail-section">
                    <h4>Sender Details</h4>
                    <p><strong>Name:</strong> {item.sender.name}</p>
                    <p><strong>Phone:</strong> {item.sender.phone}</p>
                  </div>
                </div>

                <div className="shipment-actions">
                  {item.status === "delivered" && (
                    <span className="completion-badge">✓ Completed</span>
                  )}
                  {item.status === "failed" && (
                    <span className="completion-badge failed">✗ Failed</span>
                  )}
                  <button onClick={() => openManifest(item)} className="manifest-button">
                          Manifest
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          activeShipments.length === 0 ? (
            <div className="no-assignments">
              <p>No assignments at the moment</p>
              <p>Check back later or contact support</p>
            </div>
          ) : (
            activeShipments.map((item) => (
              <div key={item._id} className="shipment-card">
                <div className="shipment-header">
                  <h3>{item.trackingId}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(item.status) }}
                  >
                    {item.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>

                <div className="shipment-details">
                  <div className="detail-section">
                    <h4>Receiver Details</h4>
                    <p><strong>Name:</strong> {item.receiver.name}</p>
                    <p><strong>Phone:</strong> {item.receiver.phone}</p>
                    <p><strong>Email:</strong> {item.receiver.email}</p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {[
                        item.receiver.street,
                        item.receiver.city,
                        item.receiver.country,
                        item.receiver.postalCode
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      </p>
                  </div>

                  <div className="detail-section">
                    <h4>Sender Details</h4>
                    <p><strong>Name:</strong> {item.sender.name}</p>
                    <p><strong>Phone:</strong> {item.sender.phone}</p>
                  </div>
                </div>

                <div className="shipment-actions">
                  {item.status !== "delivered" && item.status !== "failed" && (
                    <>
                      <button onClick={() => setIsScanModalOpen(true)} className="scan-button">
                          Scan Barcode
                      </button>
                      <button onClick={() => openManifest(item)} className="manifest-button">
                          Manifest
                      </button>
                    </>
                  )}

                  {item.status === "delivered" && (
                    <span className="completion-badge">✓ Completed</span>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={handleScanComplete}
        assignments={shipments}
      />

      {/* Scanned Shipment Modal */}
      <ScannedShipmentModal
        isOpen={isScannedShipmentModalOpen}
        shipment={scannedShipment}
        driverId={driverId}
        onClose={handleScannedShipmentModalClose}
        onStatusUpdate={handleScannedStatusUpdate}
      />
    </div>
  );
}