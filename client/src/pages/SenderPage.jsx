import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/SenderPage.css";

const emptyContact = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  postalCode: "",
  country: ""
};

export default function SenderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const [formData, setFormData] = useState({
    sender: { ...emptyContact },
    receiver: { ...emptyContact },
    payment: { amount: "₹349", method: "VISA", card: "••••" }
  });

  const routeSummary = useMemo(() => { //useMemo memorises the computed value and only recalculates it when the dependencies change.
    const sender = formData.sender.city || formData.sender.street || "Origin";
    const receiver = formData.receiver.city || formData.receiver.street || "Destination";
    return `${sender} to ${receiver}`;
  }, [formData.sender, formData.receiver]);

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/shipment", {
        sender: formData.sender,
        receiver: formData.receiver
      });

      setTrackingId(response.data.shipment.trackingId);
      setShowConfirmation(true);
      setFormData({
        sender: { ...emptyContact },
        receiver: { ...emptyContact }
      });

      setTimeout(() => {
        navigate(`/track/${response.data.shipment.trackingId}`);
      }, 4200);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.response?.data?.error || "Error creating shipment"
      );
      setLoading(false);
    }
  };

  // Animation sequence for booking confirmation
  useEffect(() => {
    if (showConfirmation) {
      startBookingAnim(formData.sender, formData.receiver, trackingId);
    }
  }, [showConfirmation]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startBookingAnim = async (sender, receiver, tid) => {
    const paperCard = document.getElementById("paperCard");
    const box = document.getElementById("boxWrap");
    const sticker = document.getElementById("boxSticker");
    const reveal = document.getElementById("trackingReveal");
    const btn = document.getElementById("newBookBtn");
    const status = document.getElementById("animStatus");
    const lid = document.getElementById("boxLidG");
    const stamp = document.getElementById("bookedStamp");

    // Reset states
    if (paperCard) paperCard.style.cssText = "opacity:0;transform:translate(-50%,0);transition:none;";
    if (box) box.style.cssText = "margin-top:120px;display:flex;flex-direction:column;align-items:center;opacity:0;transform:scale(0.5);transition:none;";
    if (sticker) sticker.style.cssText = "position:absolute;bottom:30px;left:50%;transform:translateX(-50%) scale(0);transition:none;";
    if (reveal) reveal.className = "tracking-reveal";
    if (btn) btn.className = "new-book-btn";
    if (lid) lid.setAttribute("transform", "rotate(0 100 80)");
    if (status) status.textContent = "Preparing your booking...";
    if (stamp) {
      stamp.style.opacity = "0";
      stamp.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(2.5)";
      stamp.style.transition = "none";
    }

    await delay(400);

    // Pop box in
    if (box) {
      box.style.transition = "opacity 0.6s cubic-bezier(0.34,1.56,0.64,1), transform 0.6s cubic-bezier(0.34,1.56,0.64,1)";
      box.style.opacity = "1";
      box.style.transform = "scale(1)";
    }
    if (status) status.textContent = "Opening parcel...";
    await delay(700);

    // Open lid
    if (lid) {
      lid.style.transition = "transform 0.7s cubic-bezier(0.4,0,0.2,1)";
      lid.setAttribute("transform", "rotate(-80 100 80)");
    }
    await delay(700);

    // NOW show paper card AFTER lid opens
    if (paperCard) {
      paperCard.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      paperCard.style.opacity = "1";
    }
    if (status) status.textContent = "Folding your details...";
    await delay(600);

    // Paper card flies into box
    if (paperCard) {
      paperCard.style.transition = "all 0.8s cubic-bezier(0.55,0,1,0.45)";
      paperCard.style.opacity = "0";
      paperCard.style.transform = "translate(-50%, 160px) scale(0.2) rotate(10deg)";
    }
    if (status) status.textContent = "Packing your details...";
    await delay(800);

    // Close lid
    if (lid) {
      lid.style.transition = "transform 0.6s cubic-bezier(0.4,0,0.2,1)";
      lid.setAttribute("transform", "rotate(0 100 80)");
    }
    if (status) status.textContent = "Sealing the package...";
    await delay(700);

    // Box pulse
    if (box) {
      box.style.transition = "transform 0.3s ease";
      box.style.transform = "scale(1.08)";
    }
    await delay(150);
    if (box) box.style.transform = "scale(1)";
    await delay(200);

    if (stamp) {
      stamp.style.transition = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease";
      stamp.style.opacity = "1";
      stamp.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(1)";
    }
    await delay(300);

    // Show sticker
    if (sticker) {
      sticker.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
      sticker.style.transform = "translateX(-50%) scale(1)";
    }
    if (status) status.textContent = "Attaching payment receipt...";
    await delay(700);

    // Final confirmation
    if (status) status.textContent = "✅ Shipment Confirmed!";
    await delay(400);
    if (reveal) reveal.classList.add("visible");
    await delay(500);
    if (btn) btn.classList.add("visible");
  };

  const renderContactFields = (section, title, subtitle) => (
    <section className={`booking-card ${section}-section`}>
      <div className="b-card-title">
        <span>{section === "sender" ? "01" : "02"}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Full Name</span>
          <input
            type="text"
            name="name"
            placeholder={section === "sender" ? "Your full name" : "Receiver name"}
            value={formData[section].name}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder={section === "sender" ? "you@email.com" : "receiver@email.com"}
            value={formData[section].email}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field">
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            placeholder="9876543210"
            value={formData[section].phone}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field">
          <span>Country</span>
          <input
            type="text"
            name="country"
            placeholder="India"
            value={formData[section].country}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field wide">
          <span>Street Address</span>
          <input
            type="text"
            name="street"
            placeholder="Street, building, area"
            value={formData[section].street}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field">
          <span>City</span>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData[section].city}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>

        <label className="field">
          <span>Postal Code</span>
          <input
            type="text"
            name="postalCode"
            placeholder="Postal code"
            value={formData[section].postalCode}
            onChange={(e) => handleInputChange(e, section)}
            required
          />
        </label>
      </div>
    </section>
  );

  if (showConfirmation) {
    return (
      <div className="sender-container booking-confirmation-screen" id="screen-booking-anim">
        <div className="anim-stage-inner">

          {/* Details Paper Card (animates into box) */}
          <div className="paper-card" id="paperCard">
            <div className="card-section-title">📤 Sender</div>
            <div className="card-details">
              <div className="detail-row"><strong>{formData.sender.name}</strong></div>
              <div className="detail-row">📍 {formData.sender.street}, {formData.sender.city}</div>
              <div className="detail-row">📞 {formData.sender.phone}</div>
            </div>
            <div className="card-divider"></div>
            <div className="card-section-title">📥 Receiver</div>
            <div className="card-details">
              <div className="detail-row"><strong>{formData.receiver.name}</strong></div>
              <div className="detail-row">📍 {formData.receiver.street}, {formData.receiver.city}</div>
              <div className="detail-row">📞 {formData.receiver.phone}</div>
            </div>
          </div>

          {/* Box with Details Inside */}
          <div className="box-wrap" id="boxWrap">
            <svg className="booking-box-svg" viewBox="0 0 200 200" width="280" height="280" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
                </linearGradient>
              </defs>
              {/* Box Body */}
              <rect x="20" y="80" width="160" height="110" rx="6" fill="#7c3aed" stroke="#6B2FD9" strokeWidth="2"/>
              <rect x="20" y="80" width="160" height="110" rx="6" fill="url(#boxGrad)"/>
              
              {/* Tape - vertical center */}
              <rect x="88" y="80" width="24" height="110" fill="rgba(167,139,250,0.5)"/>
              
              {/* Tape - horizontal */}
              <rect x="20" y="125" width="160" height="14" fill="rgba(167,139,250,0.5)"/>
              
              {/* Lid - Rectangle */}
              <g id="boxLidG" style={{transformOrigin: "100px 80px"}}>
                <rect x="15" y="55" width="170" height="32" rx="6" fill="#8B5CF6" stroke="#6B2FD9" strokeWidth="2"/>
                <rect x="15" y="55" width="170" height="32" rx="6" fill="rgba(255,255,255,0.05)"/>
                <rect x="15" y="68" width="170" height="8" fill="rgba(167,139,250,0.4)"/>
              </g>
            

              {/*booked stamp*/}
              <div className="booked-stamp" id="bookedStamp">
                BOOKED
              </div>
            </svg>
            
            {/* Details Inside Box */}
            <div className="box-content-display" id="boxContentDisplay">
              <div className="box-content-sender">
                <span className="box-label">From:</span>
                <span className="box-value">{formData.sender.city}</span>
              </div>
              <div className="box-content-arrow">→</div>
              <div className="box-content-receiver">
                <span className="box-label">To:</span>
                <span className="box-value">{formData.receiver.city}</span>
              </div>
            </div>

            {/* Sticker on Box */}
            <div className="box-sticker" id="boxSticker">
              <div className="sticker-tid">{trackingId}</div>
              <div className="sticker-subtitle">Ready for tracking</div>
            </div>
          </div>

          <p className="anim-status" id="animStatus">Preparing your booking...</p>
          <div className="tracking-reveal" id="trackingReveal">
            <div className="tr-label">Your Tracking ID</div>
            <div className="tr-id">{trackingId}</div>
            <div className="tr-subtitle">Save this to track your shipment</div>
          </div>
          <button className="new-book-btn" id="newBookBtn" onClick={() => navigate(`/track/${trackingId}`)}>
            📍 Track Package
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sender-container booking-screen">
      <button className="back-nav-btn" onClick={() => navigate("/")}>
        Back
      </button>

      <header className="booking-header">
        <h1>Make a <span>Booking</span></h1>
        <p>Fill in the details below — we handle the rest</p>
      </header>

      {errorMessage && (
        <div className="error-message booking-error">
          <span className="error-icon">!</span>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-grid">
        {renderContactFields("sender", "Sender Details", "Where the parcel starts")}
        {renderContactFields("receiver", "Receiver Details", "Where the parcel goes")}

        <div className="booking-action-row">
          <button type="submit" className="book-btn" disabled={loading}>
            {loading ? "Packing..." : "Book Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}
