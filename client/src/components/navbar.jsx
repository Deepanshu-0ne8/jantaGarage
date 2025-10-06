import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span className="navbar-title">Janta Garage</span>
      </div>

      <div className="navbar-right">
        <Link
          to="/home"
          className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
        >
          Home
        </Link>
        <Link
          to="/profile"
          className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
        >
          Profile
        </Link>
        <Link
          to="/reports"
          className={`nav-link ${location.pathname === "/reports" ? "active" : ""}`}
        >
          Reports
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
