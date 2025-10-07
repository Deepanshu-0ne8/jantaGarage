// src/pages/Signin.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./signin.css";

const Signin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // use context login function
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password); // call context login
      setLoading(false);

      if (res.success) {
        alert("Login successful!");
        navigate("/home"); // redirect to home page after login
      } else {
        alert(res.message || "Login failed");
      }
    } catch (error) {
      setLoading(false);
      alert(error.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h2>Sign In</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="signin-btn">
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="back-home">
          <Link to="/">← Back to Landing Page</Link>
        </p>
      </div>
    </div>
  );
};

export default Signin;
