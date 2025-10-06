import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./signup.css"; // use the same CSS for consistent theme

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/signin", { email, password });
      setLoading(false);

      if (res.data.success) {
        alert("Login successful!");
        navigate("/home"); // redirect to home
      } else {
        alert(res.data.message || "Login failed");
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
          <button type="submit" className="signup-btn">
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>
        <p className="login-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="back-home">
          <Link to="/">← Back to Landing Page</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
