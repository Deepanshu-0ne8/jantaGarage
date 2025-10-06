import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contact: "",
    role: "citizen",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/register", formData);
      setLoading(false);

      if (res.data.success) {
        navigate("/verify-otp", { state: { email: formData.email } });
      } else {
        alert(res.data.message || "Signup failed");
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
        <h2>Create Account</h2>
        <p className="signup-subtitle">Join Janta Garage to manage your account</p>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            id="userName"
            value={formData.userName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            placeholder="Email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="Password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            placeholder="Contact Number"
            id="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
          <select id="role" value={formData.role} onChange={handleChange}>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
          <button type="submit" className="signup-btn">
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <p className="back-home">
          <Link to="/">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
