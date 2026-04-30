import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

//bunch of extra imports for leaflet marker icons and styles. they were broken.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../styles/TrackingPage.css";
import packageImg from "../assets/package1.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
//end of leaflet marker fixes

const statusLabels = {
  booked: "Order Placed",
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Failed"
};

const statusColors = {
  booked: "#E9C46A",
  assigned: "#7B2CBF",
  picked_up: "#C77DFF",
  in_transit: "#22D3EE",
  out_for_delivery: "#F72585",
  delivered: "#30E080",
  failed: "#FF4D6D"
};

function PlaceholderMap() {
  return (
    <div className="placeholder-map">
      <div className="map-grid" />
      <div className="fake-route" />
      <div className="fake-pin pin-a">A</div>
      <div className="fake-pin pin-b">B</div>
      <div className="placeholder-parcel">
        <div className="mini-parcel parcel-one"><span /></div>
        <p>Scan checkpoints will appear here once the driver updates status.</p>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  const { trackingId = "" } = useParams();
  const cleanTrackingId = trackingId.trim();
  const navigate = useNavigate();
  const isSearchPage = cleanTrackingId === "search" || !cleanTrackingId;
  const [searchId, setSearchId] = useState(isSearchPage ? "" : cleanTrackingId); // prefill search input if trackingId is present in URL
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  useEffect(() => {
    if (isSearchPage) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    axios.get(`http://localhost:5000/api/track/${encodeURIComponent(cleanTrackingId)}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError("Shipment not found. Please check the tracking ID.");
        console.log(err);
      })
      .finally(() => setLoading(false));
  }, [cleanTrackingId, isSearchPage]);

  const scanPositions = useMemo(() => {
    if (!data?.scans) {
      return [];
    }

    return data.scans
      .filter((scan) => scan.location && typeof scan.location.lat === "number" && typeof scan.location.lng === "number")
      .map((scan) => ({
        scan,
        position: [scan.location.lat, scan.location.lng]
      }));
  }, [data]);

  const positions = scanPositions.map((point) => point.position);
  const center = positions.length > 0 ? positions[positions.length - 1] : [17.385, 78.4867];
  const currentStatus = data?.shipment?.status || "booked";

  const submitSearch = (event) => {
    event.preventDefault();
    const nextTrackingId = searchId.trim();
    if (nextTrackingId) {
      navigate(`/track/${encodeURIComponent(nextTrackingId)}`);
    }
  };

  if (isSearchPage) {
  return (
    <div className="tracking-page mock-track">
      <button onClick={() => navigate("/")} className="back-button floating-back">Back</button>

      {/* scattered package decorations */}
      <div className="pkg-scatter" aria-hidden="true">
        <img src={packageImg} className="pkg pkg-1" alt="" />
        <img src={packageImg} className="pkg pkg-2" alt="" />
        <img src={packageImg} className="pkg pkg-3" alt="" />
        <img src={packageImg} className="pkg pkg-4" alt="" />
        <img src={packageImg} className="pkg pkg-5" alt="" />
        <img src={packageImg} className="pkg pkg-6" alt="" />
      </div>

      <section className="track-search-screen">
        <h1>Track <span>Parcel</span></h1>
        <p>Paste your tracking ID below to see live scan updates.</p>
        <form className="track-search-wrap big-search" onSubmit={submitSearch}>
          <input
            className="track-input"
            value={searchId}
            onChange={(event) => setSearchId(event.target.value)}
            placeholder="TRK-XXXXXXXXXXXXX"
            autoFocus
          />
          <button className="track-go-btn" type="submit">Search</button>
        </form>
      </section>
    </div>
  );
}

  if (loading) {
    return (
      <div className="tracking-page mock-track">
        <div className="tracking-page-loading">Loading tracking information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-page mock-track">
        <button onClick={() => navigate("/")} className="back-button floating-back">Back</button>
        <div className="track-error-card">
          <h2>{error}</h2>
          <p>Try another tracking ID or return to the homepage.</p>
          <button onClick={() => navigate("/")} className="track-go-btn">Home</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="tracking-page-loading">No data available</div>;
  }

  const scans = data.scans || [];
  const barcodeSrc = data.shipment.barcodeUrl || `/barcodes/${cleanTrackingId}.png`;

  //combines address fields into a single line address.
  const formatAddress = (person) => {
    if (!person) return "Address not available";

    const parts = [
      person.street,
      person.city,
      person.postalCode,
      person.country,
      person.address
    ].filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    );

    return parts.length > 0
      ? parts.join(", ")
      : "Address not available";
  };

  //creates URL with trackingID and reciever details to pass to jsp, which then creates a printable receipt.
  const openReceipt = () => {
  if (!data?.shipment) return;

  const shipment = data.shipment;
  const r = shipment.receiver || {};

  const url =
    `http://localhost:8080/ParcelFlow/receipt.jsp` +
    `?trackingId=${encodeURIComponent(shipment.trackingId || "")}` +
    `&receiver=${encodeURIComponent(r.name || "")}` +
    `&street=${encodeURIComponent(r.street || r.address || "")}` +
    `&city=${encodeURIComponent(r.city || "")}` +
    `&postalCode=${encodeURIComponent(r.postalCode || "")}` +
    `&country=${encodeURIComponent(r.country || "")}` +
    `&time=${encodeURIComponent(
      shipment.updatedAt
        ? new Date(shipment.updatedAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : ""
    )}`;

  window.open(url, "_blank");
};

  return (
    <div className="tracking-page mock-track">
      <button onClick={() => navigate("/")} className="back-button floating-back">Back</button>

      <header className="track-header">
        <h1>Track <span>Shipment</span></h1>
        <form className="track-search-wrap" onSubmit={submitSearch}>
          <input
            className="track-input"
            value={searchId}
            onChange={(event) => setSearchId(event.target.value)}
            placeholder="TRACKING ID"
          />
          <button className="track-go-btn" type="submit">Go</button>
        </form>
      </header>

      <main className="track-results visible">
        <aside className="status-panel">
          <p className="sp-kicker">Live package</p>
          <h2 className="sp-tid">Package Details</h2>
          <span
            className="sp-status-badge"
            style={{ backgroundColor: statusColors[currentStatus] }}
          >
            {statusLabels[currentStatus] || currentStatus}
          </span>

          <div className="saved-barcode-card">
            <img src={`http://localhost:5000${barcodeSrc}`} alt={`Barcode for ${cleanTrackingId}`} />
            <span>{cleanTrackingId}</span>
            {currentStatus === "delivered" && (
              <button onClick={openReceipt} className="receipt-button">
                Delivery Receipt
              </button>
            )}
          </div>

          <div className="track-contact-card">
            <h3>Sender</h3>
            <p>{data.shipment.sender?.name || "Sender"}</p>
            <span>{formatAddress(data.shipment.sender)}</span>
            <span>{data.shipment.sender?.phone || "Phone not available"}</span>
          </div>

          <div className="track-contact-card">
            <h3>Receiver</h3>
            <p>{data.shipment.receiver?.name || "Receiver"}</p>
            <span>{formatAddress(data.shipment.receiver)}</span>
            <span>{data.shipment.receiver?.phone || "Phone not available"}</span>
          </div>

          <div className="track-contact-card driver-card-mini">
            <h3>Driver</h3>
            <p>{data.shipment.assignedDriverId?.name || "Not assigned"}</p>
            <span>{data.shipment.assignedDriverId?.vehicleType || "Vehicle not available"}</span>
            <span>{data.shipment.assignedDriverId?.phone || "Phone not available"}</span>
          </div>
        </aside>

        <section className="track-main-panel">
          <div className="track-map-card">
            <div className="panel-title-row">
              <h2>Delivery Route</h2>
              <span>{positions.length} scan points</span>
            </div>

            {positions.length > 0 ? (
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: "420px", width: "100%", borderRadius: "18px" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {scanPositions.map((point, index) => (
                  <Marker key={index} position={point.position}>
                    <Popup>
                      Scan #{index + 1}: {statusLabels[point.scan.status] || point.scan.status}
                    </Popup>
                  </Marker>
                ))}
                
                <Polyline positions={positions} color="#F72585" weight={4} opacity={0.85} />
              </MapContainer>
            ) : (
              <PlaceholderMap />
            )}
          </div>

          <div className="timeline-panel">
            <div className="panel-title-row">
              <h2>Journey Log</h2>
              <span>{scans.length ? "Updated by scan events" : "Awaiting first scan"}</span>
            </div>

            <div className="timeline">
              {scans.length === 0 ? (
                <div className="empty-timeline">
                  <div className="mini-parcel parcel-two"><span /></div>
                  <p>No scan history yet.</p>
                </div>
              ) : (
                scans.map((scan, index) => {
                  const isLatest = index === scans.length - 1;
                  const label = statusLabels[scan.status] || scan.status.replace(/_/g, " ");

                  return (
                    <article className={`tl-item ${isLatest ? "active" : "done"}`} key={`${scan.status}-${scan.scannedAt}-${index}`}>
                      <div className="tl-dot">{isLatest ? ">" : "✓"}</div>
                      <div className="tl-info">
                        <h3>{label}</h3>
                        <p>
                          {new Date(scan.scannedAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </p>
                        {scan.isSystemEvent && (
                          <span>Shipment booking created</span>
                        )}
                        {scan.location && (
                          <span>
                            Lat {scan.location.lat.toFixed(4)}, Lng {scan.location.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
