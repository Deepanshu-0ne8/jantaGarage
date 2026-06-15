import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useSocket } from "../context/SocketContext"; 
import { getNotifications, removeNotification, clearAllNotifications } from "../services/UserServices"; 
import logo from "../assets/logo.png";
import "./navbar.css";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const socket = useSocket(); 

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
    setIsNotificationPanelOpen(false); 
  };
  
  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(prev => !prev);
    setIsPanelOpen(false); 
    if (!isNotificationPanelOpen) {
        setUnreadCount(0); 
    }
  };

  // --- Notification Management Functions ---

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const data = await getNotifications(); 
      setNotifications(data);
      // Assuming all fetched notifications count towards the badge for now
      // If you implement a read/unread toggle later, you can filter by !n.read
      setUnreadCount(data.length); 
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // ⚠️ STRICTLY uses notificationId for deletion as per the new schema
  const handleRemoveNotification = async (notificationId) => {
    try {
      // Optimistic UI update: Filter out using notificationId
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Call API to remove from DB using the specific Notification ID
      await removeNotification(notificationId);
      
    } catch (err) {
      console.error("Failed to remove notification:", err);
      // Re-fetch if API call fails to restore state integrity
      fetchNotifications(); 
    }
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
        // Optimistic UI update
        setNotifications([]);
        setUnreadCount(0);
        setIsNotificationPanelOpen(false);

        // Call the single removeAll API
        await clearAllNotifications();
        
    } catch (e) {
        console.error("Error during clear all:", e);
        fetchNotifications(); // Revert state if it fails
    }
  };

  // --- Fetch and Socket Listeners (Mount Logic) ---

  useEffect(() => {
    fetchNotifications();
  }, [user]); 

  useEffect(() => {
    if (!user || !socket) return;

    const handleOverdueReport = (payload) => {
      // Create a temporary object matching your new mongoose schema structure
      const newNotification = {
        notificationId: `temp-${Date.now()}`, // Temporary ID until page refreshes and pulls real ObjectId
        reportId: payload.id,
        message: `Report #${payload.id.substring(0, 8)} is now OVERDUE!`,
        time: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on("reportOverdue", handleOverdueReport);

    const registerUser = () => {
        socket.emit("registerUser", user._id);
    };

    if (socket.connected) {
      registerUser();
    } else {
      socket.once("connect", registerUser);
    }

    return () => {
        socket.off("reportOverdue", handleOverdueReport);
        socket.off("connect", registerUser); 
    }
  }, [user, socket]);

  // --- Click Outside/Escape Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isPanelOpen &&
        panelRef.current && 
        !panelRef.current.contains(event.target) && 
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target) 
      ) setIsPanelOpen(false);

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
                notifications.map((n) => (
                    <div
                      key={n.notificationId} 
                      className={`notification-item ${n.read ? 'read' : 'unread'}`}
                    >
                        <i className={`fas fa-exclamation-circle alert-icon`}></i>
                        <div className="notification-content">
                            <p className="notification-message">{n.message}</p>
                            <span className="notification-time">
                              {n.time ? new Date(n.time).toLocaleString() : 'Just now'}
                            </span>
                            <div className="notification-actions">
                                <button 
                                  className="mark-read-btn" 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveNotification(n.notificationId); // Uses notificationId
                                  }}
                                >
                                  remove
                                </button>
                                <Link 
                                    to={`/reportDetail/${n.reportId}`} // Uses reportId for routing
                                    className="notification-link"
                                    onClick={() => {
                                      handleRemoveNotification(n.notificationId); // Uses notificationId
                                      setIsNotificationPanelOpen(false);
                                    }} 
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