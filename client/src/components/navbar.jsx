// src/components/Navbar.jsx (Final Component - Removed Points & Settings)

import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import logo from "../assets/logo.png";
import "./navbar.css";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false); 
  const panelRef = useRef(null);
  const profileButtonRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleProfileClick = () => {
    setIsPanelOpen(prev => !prev);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isPanelOpen &&
        panelRef.current && 
        !panelRef.current.contains(event.target) && 
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target) 
      ) {
        setIsPanelOpen(false);
      }
    };
    
    const handleEscape = (event) => {
        if (isPanelOpen && event.key === 'Escape') {
            setIsPanelOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPanelOpen]);

  const getUserAvatar = () => {
    if (user?.displaypic?.url) {
        return <img src={user.displaypic.url} alt="Profile" className="profile-avatar-img" />;
    }
    const initial = user?.name ? user.name[0].toUpperCase() : '👤'; 
    return <div className="profile-avatar-initial">{initial}</div>;
  };

  const closePanelAndNavigate = () => {
      setIsPanelOpen(false);
  };


  // --- User Panel Component (Floating Modal - Updated Grid) ---
  const UserPanel = () => (
    <div ref={panelRef} className="user-panel">
        
        {/* Top Section: Profile Preview & Status */}
        <div className="panel-header">
            <div className="panel-user-info">
                {getUserAvatar()}
                <div className="panel-text-info">
                    <span className="panel-user-name">{user.name || user.userName}</span> 
                    <span className="panel-premium-status">
                        Access features with your {user.role.toUpperCase()} role!
                    </span>
                </div>
            </div>
        </div>

        {/* Middle Section: Grid Icons (Now 3 links, 1x3 or 2x2 layout) */}
        <div className="panel-grid">
            
            <Link to="/reports" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container reports-icon">
                    <i className="fas fa-list-alt"></i> 
                </div>
                Reports
            </Link>
            <Link to="/profile" className="panel-grid-item" onClick={closePanelAndNavigate}>
                 <div className="icon-container profile-settings-icon">
                    <i className="fas fa-user-circle"></i> 
                </div>
                Profile
            </Link>
            <Link to="/home" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container home-icon">
                    <i className="fas fa-home"></i> 
                </div>
                Home
            </Link>
            <Link to="/departmentalReports" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container home-icon">
                    <i className="fas fa-home"></i> 
                </div>
                Departmental Reports
            </Link>
        </div>
        
        <div className="panel-divider"></div>

        {/* Lower Section: Sign Out Only */}
        <div className="panel-links">
            {/* Removed: Direct Link to Profile (Settings) */}
            
            {/* Logout Button */}
            <button className="panel-link-item sign-out-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    </div>
  );


  // --- Main Navbar Render ---
  return (
    <nav className="navbar">
      {/* Left side: Logo + Title */}
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span className="navbar-title">Janta Garage</span> 
      </div>

      {/* Right side: Links + User Menu Toggle */}
      <div className="navbar-right">
        <Link to="/home" className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}>
          Home
        </Link>
        <Link to="/reports" className={`nav-link ${location.pathname === "/reports" ? "active" : ""}`}>
          Reports
        </Link>
        
        {user ? (
          <div className="user-menu-wrapper"> 
            <button 
                ref={profileButtonRef}
                className={`profile-panel-toggle-btn ${isPanelOpen ? 'active' : ''}`} 
                onClick={handleProfileClick}
                title={`Hello, ${user.name}`}
            >
              {getUserAvatar()}
            </button>
            
            {/* Render the floating panel when open */}
            {isPanelOpen && UserPanel()}
          </div>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}>
              Login
            </Link>
            <Link to="/signup" className={`nav-link ${location.pathname === "/signup" ? "active" : ""}`}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;