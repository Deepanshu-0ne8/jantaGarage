import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useSocket } from "../context/SocketContext"; // Import useSocket hook
import { getNotifications, removeNotification } from "../services/UserServices"; // Import API services
import logo from "../assets/logo.png";
import "./navbar.css";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const socket = useSocket(); // Get the active socket instance from context

  const [isPanelOpen, setIsPanelOpen] = useState(false); 
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const panelRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleProfileClick = () => {
    setIsPanelOpen(prev => !prev);
    setIsNotificationPanelOpen(false); // Close notifications when opening profile
  };
  
  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(prev => !prev);
    setIsPanelOpen(false); // Close profile panel when opening notifications
    if (!isNotificationPanelOpen) {
        setUnreadCount(0); // Clear badge count when panel is opened
    }
  };

  
  // --- Notification Management Functions ---

  // Fetches initial notifications from DB on mount
  const fetchNotifications = async () => {
    try {
      if (!user) return;
      // Fetch notifications currently stored in the user document
      const data = await getNotifications(); 
      setNotifications(data);
      // Count total notifications as unread since backend handles state based on existence
      setUnreadCount(data.length); 
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const reportDetail = () => {
    setIsNotificationPanelOpen(false);
    <Navigate to={`/report/${notifications.id}`} />;
  };

  // Function to remove a single notification (used by button and link click)
  const handleRemoveNotification = async (id, isNavigating = false) => {
    try {
      // Optimistic UI update before calling API
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Call API to remove from DB (using the Report ID)
      await removeNotification(id);
      
      // If navigating, allow the navigation to proceed
      if (isNavigating) {
        setIsNotificationPanelOpen(false);
      }
    } catch (err) {
      console.error("Failed to remove notification:", err);
      // Re-fetch if API call fails to restore state integrity
      fetchNotifications(); 
    }
  };

  // Function to clear all visible notifications
  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
        const ids = notifications.map(n => n.id);
        
        // Optimistic UI update
        setNotifications([]);
        setUnreadCount(0);
        setIsNotificationPanelOpen(false);

        // Batch remove calls 
        const removePromises = ids.map(id => removeNotification(id).catch(e => console.error(`Failed to clear ${id}`)));
        await Promise.all(removePromises);
        
        // Final verification fetch to ensure all are gone
        await fetchNotifications(); 
    } catch (e) {
        console.error("Error during clear all:", e);
    }
  };


  // --- Fetch and Socket Listeners (Mount Logic) ---

  useEffect(() => {
    fetchNotifications();
  }, [user]); // Fetch initial notifications when user context is ready

  useEffect(() => {
    if (!user || !socket) return;

    const handleOverdueReport = (payload) => {
      const newNotification = {
        id: payload.id,
        message: `Report #${payload.id.substring(0, 8)} is now OVERDUE!`,
        time: new Date().toLocaleString(),
      };
      
      // Update state for real-time visibility
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      console.log("🔔 NOTIFICATION RECEIVED:", payload.title);
    };

    // 1. Set up listener FIRST
    socket.on("reportOverdue", handleOverdueReport);

    // 2. Register User ID SECOND (ensures listener is active)
    const registerUser = () => {
        socket.emit("registerUser", user._id);
        console.log(`📡 Emitting registerUser ${user._id} to join room.`);
    };

    if (socket.connected) {
      registerUser();
    } else {
      // Fallback registration if socket connection is delayed
      socket.once("connect", registerUser);
    }

    return () => {
        socket.off("reportOverdue", handleOverdueReport);
        socket.off("connect", registerUser); // Clean up connect listener too
    }
  }, [user, socket]);

  // --- Click Outside/Escape Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check profile panel closure
      if (
        isPanelOpen &&
        panelRef.current && 
        !panelRef.current.contains(event.target) && 
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target) 
      ) setIsPanelOpen(false);

      // Check notification panel closure
      if (
        isNotificationPanelOpen &&
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target)
      ) setIsNotificationPanelOpen(false);
    };
    
    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            setIsPanelOpen(false);
            setIsNotificationPanelOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPanelOpen, isNotificationPanelOpen]);

  const getUserAvatar = () => {
    if (user?.displaypic?.url) return <img src={user.displaypic.url} alt="Profile" className="profile-avatar-img" />;
    const initial = user?.name ? user.name[0].toUpperCase() : '👤'; 
    return <div className="profile-avatar-initial">{initial}</div>;
  };

  const closePanelAndNavigate = () => setIsPanelOpen(false);

  // --- Notification Panel Component ---
  const NotificationPanel = () => (
    <div ref={notificationPanelRef} className="notification-panel">
        <div className="panel-header notification-header">
            <h4 className="panel-title">Notifications ({notifications.length})</h4>
            <button className="clear-all-btn" onClick={handleClearAll} disabled={notifications.length === 0}>
                Clear All
            </button>
        </div>
        
        <div className="notification-list">
            {notifications.length > 0 ? (
                notifications.map((n, index) => (
                    // NOTE: Keying by index is discouraged, but necessary here since the 'id' field is an ObjectId that may not change if the object is reused. 
                    // Using n.id as a string is the best option for persistence.
                    <div
                      key={n.id} 
                      className="notification-item unread"
                    >
                        <i className={`fas fa-exclamation-circle alert-icon`}></i>
                        <div className="notification-content">
                            <p className="notification-message">{n.message}</p>
                            <span className="notification-time">{new Date(n.time).toLocaleTimeString()}</span>
                            <div className="notification-actions">
                                <button 
                                  className="mark-read-btn" 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveNotification(n.id);
                                  }}
                                >
                                  mark as read
                                </button>
                                <Link 
                                    to={`/reportDetail/${n.id}`} 
                                    className="notification-link"
                                    onClick={ handleRemoveNotification(n.id) } // Remove notification upon viewing report
                                >
                                    View Report »
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="no-notifications">No notifications</p>
            )}
        </div>
    </div>
  );

  const UserPanel = () => (
    <div ref={panelRef} className="user-panel">
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

        <div className="panel-grid">
            <Link to="/reports" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container reports-icon"><i className="fas fa-list-alt"></i></div>
                Reports
            </Link>
            <Link to="/profile" className="panel-grid-item" onClick={closePanelAndNavigate}>
                 <div className="icon-container profile-settings-icon"><i className="fas fa-user-circle"></i></div>
                Profile
            </Link>
            <Link to="/home" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container home-icon"><i className="fas fa-home"></i></div>
                Home
            </Link>
            <Link to="/departmentalReports" className="panel-grid-item" onClick={closePanelAndNavigate}>
                <div className="icon-container home-icon"><i className="fas fa-building"></i></div>
                Dept. Reports
            </Link>
        </div>
        
        <div className="panel-divider"></div>

        <div className="panel-links">
            <button className="panel-link-item sign-out-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    </div>
  );

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span className="navbar-title">Janta Garage</span> 
      </div>

      <div className="navbar-right">
        <Link to="/home" className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}>Home</Link>
        <Link to="/notifications" className={`nav-link ${location.pathname === "/notifications" ? "active" : ""}`}>Reports For Verification</Link>
        
        {user ? (
          <div className="user-menu-wrapper"> 
            <button
                ref={notificationButtonRef}
                className={`notification-toggle-btn ${isNotificationPanelOpen ? 'active' : ''}`}
                onClick={handleNotificationClick}
                title="Notifications"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isNotificationPanelOpen && NotificationPanel()}

            <button 
                ref={profileButtonRef}
                className={`profile-panel-toggle-btn ${isPanelOpen ? 'active' : ''}`} 
                onClick={handleProfileClick}
                title={`Hello, ${user.name || user.userName}`}
            >
              {getUserAvatar()}
            </button>
            
            {isPanelOpen && UserPanel()}
          </div>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}>Login</Link>
            <Link to="/signup" className={`nav-link ${location.pathname === "/signup" ? "active" : ""}`}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
