import { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/DriverAuthPage.css";

export default function DriverAuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") === "register" ? false : true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState(null);
  const [loggedInName, setLoggedInName] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicleType: "sedan",
    driverLicense: ""
  });


  // e is the event Object. It makes React get triggered when a user types in an input. 
  // Basically gets email field value that user typed and updates that as the LoginData. 
  // Prev is used just to update whatever was there before. 
  // So like creates a new object using the old data, updating one field
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  //runs when a login is submitted 
  // => it sets the page to loading (disables buttons) and also clears any previous errors on the page 
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/driver/login", {
        email: loginData.email,
        password: loginData.password
      });

      //localStorage is a way to store data in the browser that persists even after the page is refreshed.
      const { driver } = response.data;
      localStorage.setItem("driverId", driver._id);
      localStorage.setItem("driverName", driver.name);
      localStorage.setItem("driverEmail", driver.email);
      localStorage.setItem("driverLicense", driver.driverLicense);
      localStorage.setItem("driverIsAvailable", JSON.stringify(driver.isAvailable));
      
      setLoading(false);
      setLoggedInName(driver.name);
      setSuccessType("login");
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 1500);

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/driver/register", {
        //registerData because it is sent to backend and stored in the database as a new entry.
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        vehicleType: registerData.vehicleType,
        driverLicense: registerData.driverLicense
      });
      
      setLoading(false);
      setSuccessType("register");
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 3000);

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  /* ── SUCCESS SCREENS ── */
  if (showSuccess) {
    if (successType === "register") {
      return (
        <div className="driver-auth-container">
          <div className="success-animation-container">
            <div className="id-card-wrap">
              <div className="id-card">
                <div className="id-card-logo">
                  <div className="id-card-logo-dot"></div>
                  KARGO DRIVER
                </div>
                <div className="id-avatar">🚛</div>
                <div className="id-name">{registerData.name}</div>
                <div className="id-detail">{registerData.phone}</div>
                <div className="id-detail">Vehicle: {registerData.vehicleType}</div>
                <div className="id-did">
                  DRV-{Math.random().toString(36).substr(2, 8).toUpperCase()}
                </div>
              </div>
            </div>
    
            <div className="reg-msg">
              YOU HAVE BEEN<br /><span>REGISTERED! 🎉</span>
            </div>
    
            <p className="redirect-message">Redirecting to login…</p>
          </div>
    
          {/* Walking human figure */}
          <div className="person-figure" id="personFigure">
            <svg viewBox="0 0 120 220" width="120" height="220" xmlns="http://www.w3.org/2000/svg">
              <rect x="30" y="90" width="60" height="90" rx="10" fill="#6B2FD9"/>
              <rect x="0" y="95" width="30" height="16" rx="8" fill="#8B5CF6" transform="rotate(-15 15 103)"/>
              <rect x="90" y="95" width="30" height="16" rx="8" fill="#8B5CF6" transform="rotate(15 105 103)"/>
              <circle cx="60" cy="60" r="32" fill="#FFD0A0"/>
              <circle cx="50" cy="56" r="4" fill="#333"/>
              <circle cx="70" cy="56" r="4" fill="#333"/>
              <path d="M47 70 Q60 82 73 70" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <rect x="33" y="175" width="22" height="40" rx="8" fill="#3d1a6e"/>
              <rect x="65" y="175" width="22" height="40" rx="8" fill="#3d1a6e"/>
              <ellipse cx="44" cy="215" rx="15" ry="7" fill="#2a1660"/>
              <ellipse cx="76" cy="215" rx="15" ry="7" fill="#2a1660"/>
              <rect x="20" y="32" width="80" height="14" rx="6" fill="#EC4899"/>
              <rect x="30" y="14" width="60" height="22" rx="8" fill="#EC4899"/>
              <rect x="38" y="18" width="44" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div className="driver-auth-container">
        <div className="login-success-container">
          <div className="success-checkmark">
            <div className="check-icon">✓</div>
          </div>
          <h2>Welcome Back, {loggedInName}!</h2>
          <p>Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── MAIN AUTH FORM ── */
  return (
    <div className="driver-auth-container">
      <button className="back-btn-auth" onClick={() => navigate("/")}>
        ← Back
      </button>

      <div className="auth-wrapper">
        <div className="auth-header">
          <h1>Driver Portal</h1>
          <p>Manage deliveries &amp; grow your income</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setErrorMessage(""); }}
          >
            Login
          </button>
          <button
            className={`tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setErrorMessage(""); }}
          >
            Register
          </button>
        </div>

        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {errorMessage}
          </div>
        )}

        {isLogin ? (
          /* ── LOGIN FORM ── */
          <form onSubmit={handleLogin} className="auth-form login-form">
            <div className="form-group-auth">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className="form-group-auth">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>
        ) : (
          /* ── REGISTER FORM ── */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-row-auth">
              <div className="form-group-auth">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="form-group-auth">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-auth" style={{ marginTop: "16px" }}>
              <div className="form-group-auth">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 555 123-4567"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="form-group-auth">
                <label>Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={registerData.vehicleType}
                  onChange={handleRegisterChange}
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
            </div>

            <div className="form-group-auth" style={{ marginTop: "16px" }}>
              <label>Driver's License Number</label>
              <input
                type="text"
                name="driverLicense"
                placeholder="License number"
                value={registerData.driverLicense}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className="form-row-auth" style={{ marginTop: "16px" }}>
              <div className="form-group-auth">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="form-group-auth">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="toggle-btn"
              onClick={() => { setIsLogin(!isLogin); setErrorMessage(""); }}
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
