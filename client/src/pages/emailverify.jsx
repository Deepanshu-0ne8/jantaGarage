import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./signup.css"; // reuse same CSS

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/verify-otp", { email, otp });
      setLoading(false);

      if (res.data.success) {
        alert("Email verified successfully!");
        navigate("/login");
      } else {
        alert(res.data.message || "Invalid OTP");
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Email Verification</h2>
        <p className="signup-subtitle">
          Enter the OTP sent to <strong>{email}</strong>
        </p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" className="signup-btn">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <p className="login-link">
          Mistyped email? <Link to="/signup" state={{ email }}>Go back to Signup</Link>
        </p>
        <p className="back-home">
          <Link to="/">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
