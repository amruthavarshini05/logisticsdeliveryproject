import senderImg from "../assets/sender.png";
import driverImg from "../assets/driver.png";
import boxImg from "../assets/box.png";
import mapImg from "../assets/map.png";
import dloginImg from "../assets/dlogin.png";
import dregImg from "../assets/dregisteration.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

function HeroTruck() {
  return (
    <svg className="truck-svg" viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="KARGO truck">
      <rect x="10" y="60" width="450" height="170" rx="12" ry="12" fill="#6A1B9A" stroke="#6B2FD9" strokeWidth="2.5" />
      <rect x="10" y="60" width="450" height="24" rx="12" ry="12" fill="#6B2FD9" />
      <rect x="10" y="72" width="450" height="12" fill="#6B2FD9" />
      <rect x="10" y="84" width="450" height="146" fill="url(#trailerGrad)" rx="0" />
      <line x1="460" y1="65" x2="460" y2="225" stroke="#8B5CF6" strokeWidth="2" />
      <rect x="10" y="215" width="450" height="15" rx="0" ry="0" fill="#0d0618" />

      <rect x="460" y="110" width="200" height="120" rx="10" ry="10" fill="#5A189A" />
      <path d="M480 110 L640 110 L660 80 L520 80 Z" fill="#5A189A" stroke="#6B2FD9" strokeWidth="2" />
      <rect x="510" y="125" width="100" height="80" rx="8" fill="#7B2CBF" stroke="#3b1466" strokeWidth="1" />
      <rect x="520" y="133" width="80" height="45" rx="6" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />

      <circle cx="471" cy="44" r="6" fill="rgba(107,47,217,0.3)">
        <animate attributeName="cy" values="44;30;20" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.2;0" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="6;10;14" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {[80, 165].map((cx) => (
      <g key={cx} className="truck-wheel">
        <circle cx={cx} cy="232" r="30" fill="#6A1B9A" stroke="#3b1466" strokeWidth="3"/>
        <circle cx={cx} cy="232" r="18" fill="#0d0618" stroke="#6B2FD9" strokeWidth="2"/>
        <circle cx={cx} cy="232" r="6" fill="#6B2FD9"/>
        <line x1={cx} y1="206" x2={cx} y2="218" stroke="#6B2FD9" strokeWidth="3" strokeLinecap="round"/>
        <line x1={cx} y1="246" x2={cx} y2="258" stroke="#6B2FD9" strokeWidth="3" strokeLinecap="round"/>
        <line x1={cx-26} y1="232" x2={cx-14} y2="232" stroke="#6B2FD9" strokeWidth="3" strokeLinecap="round"/>
        <line x1={cx+14} y1="232" x2={cx+26} y2="232" stroke="#6B2FD9" strokeWidth="3" strokeLinecap="round"/>
      </g>
    ))}

      <g className="truck-wheel">
        <circle cx="600" cy="232" r="30" fill="#6A1B9A" stroke="#3b1466" strokeWidth="3"/>
        <circle cx="600" cy="232" r="18" fill="#0d0618" stroke="#EC4899" strokeWidth="2"/>
        <circle cx="600" cy="232" r="6" fill="#EC4899"/>
        <line x1="600" y1="206" x2="600" y2="218" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
        <line x1="600" y1="246" x2="600" y2="258" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
        <line x1="574" y1="232" x2="586" y2="232" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
        <line x1="614" y1="232" x2="626" y2="232" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
      </g>

      <rect x="8" y="255" width="460" height="8" rx="4" fill="#0d0618" />
      <rect x="458" y="255" width="210" height="8" rx="4" fill="#0d0618" />

      <defs>
        <linearGradient id="trailerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(107,47,217,0.08)" />
          <stop offset="100%" stopColor="rgba(236,72,153,0.05)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [started, setStarted] = useState(false);
  const [truckLeaving, setTruckLeaving] = useState(false);
  const [chooseLabel, setChooseLabel] = useState("...");

  useEffect(() => {
    if (!started || selectedRole) return;

    const labels = ["USER", "DRIVER", "CUSTOMER", "SENDER", "..."];
    let index = 0;
    const interval = setInterval(() => {
      setChooseLabel(labels[index % labels.length]);
      index += 1;
    }, 130);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setChooseLabel("...");
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [started, selectedRole]);

  const openTrackingPrompt = () => navigate("/track/search");

  return (
    <div className="home-page mock-home">
      <div className="road">{Array.from({ length: 14 }).map((_, i) => <span className="road-line" key={i} />)}</div>

      <div className="home-content">
        {!started ? (
          <section className={`truck-stage ${truckLeaving ? "drive-away" : ""}`}>
            <div className="truck-art">
              <HeroTruck />
              <div className="truck-text-overlay">
                <span className="truck-name" contentEditable suppressContentEditableWarning>KARGO</span>
                <span className="truck-tagline" contentEditable suppressContentEditableWarning>
                  Lightning-Fast Logistics · Delivered With Care
                </span>
              </div>
            </div>
            <button
              className="start-btn"
              onClick={() => {
                setTruckLeaving(true);
                setTimeout(() => {
                  setStarted(true);
                  setTruckLeaving(false);
                }, 900);
              }}
            >
              Let's Go
            </button>
          </section>
        ) : !selectedRole ? (
          <section className="choose-screen">
            <button className="back-btn floating-back" onClick={() => setStarted(false)}>Back</button>
            <div className="choose-title">I AM A <span>{chooseLabel}</span></div>

            <div className="bubbles-row">
              <div className="bubble-wrapper">
                <button className="bubble bubble-user" onClick={() => setSelectedRole("user")}>
                  <img src={senderImg} alt="Sender" className="bubble-image" />
                </button>
                <span className="bubble-label">Sender</span>
              </div>

              <div className="bubble-wrapper">
                <button className="bubble bubble-driver" onClick={() => setSelectedRole("driver")}>
                  <img src={driverImg} alt="Driver" className="bubble-image" />
                </button>
                <span className="bubble-label">Driver</span>
              </div>
            </div>
          </section>
        ) : selectedRole === "user" ? (
          <section className="options-view mock-options">
            <button className="back-btn floating-back" onClick={() => setSelectedRole(null)}>Back</button>
            <h2 className="opts-title">What would you like to <span>do?</span></h2>
            <div className="options-grid">
              <article className="option-card send-card" onClick={() => navigate("/sender") }>
                <img src={boxImg} alt="book parcel" className="option-icon-img" />
                <h3>Book Parcel</h3>
                <p>Create a shipment with sender and receiver details.</p>
                <button className="option-btn">Book Now</button>
              </article>

              <article className="option-card track-card" onClick={openTrackingPrompt}>
                <img src={mapImg} alt="track parcel" className="option-icon-img" />
                <h3>Track Parcel</h3>
                <p>Follow scan checkpoints and delivery movement.</p>
                <button className="option-btn">Track Now</button>
              </article>
            </div>
          </section>
        ) : (
          <section className="options-view mock-options">
            <button className="back-btn floating-back" onClick={() => setSelectedRole(null)}>Back</button>
            <h2 className="opts-title">Driver <span>portal</span></h2>
            <div className="options-grid">
              <article className="option-card login-card" onClick={() => navigate("/driver/auth?mode=login")}>
                <img src={dloginImg} alt="book parcel" className="option-icon-img1" />
                <h3>Driver Login</h3>
                <p>Access assigned parcels and update shipment status.</p>
                <button className="option-btn">Sign In</button>
              </article>

              <article className="option-card register-card" onClick={() => navigate("/driver/auth?mode=register")}>
                <img src={dregImg} alt="book parcel" className="option-icon-img1" />
                <h3>Register</h3>
                <p>Join the delivery team and receive assignments.</p>
                <button className="option-btn">Register</button>
              </article>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
