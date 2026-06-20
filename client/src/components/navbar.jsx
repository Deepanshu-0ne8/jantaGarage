import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useSocket } from "../context/SocketContext"; 
import { getNotifications, removeNotification, clearAllNotifications } from "../services/UserServices"; 
import logo from "../assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const socket = useSocket(); 
  const queryClient = useQueryClient();

  const [isPanelOpen, setIsPanelOpen] = useState(false); 
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const panelRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!user) return [];
      return getNotifications();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isNotificationPanelOpen) {
      setUnreadCount(notifications.length);
    }
  }, [notifications, isNotificationPanelOpen]);

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

  // --- Notification Management Mutations ---

  const removeNotificationMutation = useMutation({
    mutationFn: removeNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old) => old?.filter(n => n.notificationId !== notificationId) || []);
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], []);
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleRemoveNotification = async (notificationId) => {
    removeNotificationMutation.mutate(notificationId);
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    setIsNotificationPanelOpen(false);
    clearAllMutation.mutate();
  };

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
    if (user?.displaypic?.url) return <img src={user.displaypic.url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/50" />;
    const initial = user?.name ? user.name[0].toUpperCase() : '👤'; 
    return <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]">{initial}</div>;
  };

  const closePanelAndNavigate = () => setIsPanelOpen(false);

  // --- Notification Panel Component ---
  const NotificationPanel = () => (
    <div ref={notificationPanelRef} className="absolute right-0 top-14 w-80 max-h-[450px] overflow-y-auto glass-card flex flex-col gap-2 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-2">
            <h4 className="text-lg font-bold text-white">Notifications ({notifications.length})</h4>
            <button 
                className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50" 
                onClick={handleClearAll} 
                disabled={notifications.length === 0}
            >
                Clear All
            </button>
        </div>
        
        <div className="flex flex-col gap-3">
            {notifications.length > 0 ? (
                notifications.map((n) => (
                    <div
                      key={n.notificationId} 
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-slate-800/80 ${n.read ? 'bg-slate-800/30 border-slate-700/50 opacity-70' : 'bg-slate-800/60 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'}`}
                    >
                        <i className={`fas fa-exclamation-circle mt-1 ${n.read ? 'text-slate-500' : 'text-blue-400'}`}></i>
                        <div className="flex-grow flex flex-col gap-1">
                            <p className="text-sm font-medium text-white">{n.message}</p>
                            <span className="text-xs text-slate-400">
                              {n.time ? new Date(n.time).toLocaleString() : 'Just now'}
                            </span>
                            <div className="flex items-center gap-3 mt-1">
                                <button 
                                  className="text-[10px] uppercase tracking-wider bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors" 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveNotification(n.notificationId); 
                                  }}
                                >
                                  Remove
                                </button>
                                <Link 
                                    to={`/reportDetail/${n.reportId}`} 
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                                    onClick={() => {
                                      handleRemoveNotification(n.notificationId); 
                                      setIsNotificationPanelOpen(false);
                                    }} 
                                >
                                    View Report &raquo;
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-slate-500 italic py-4 text-sm">No notifications</p>
            )}
        </div>
    </div>
  );

  const UserPanel = () => (
    <div ref={panelRef} className="absolute right-0 top-14 w-64 glass-card p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50 mb-4">
            {getUserAvatar()}
            <div className="flex flex-col">
                <span className="font-bold text-white leading-tight">{user.name || user.userName}</span> 
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase mt-0.5">
                    {user.role}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
            <Link to="/reports" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 hover:border-blue-500/30 transition-all group" onClick={closePanelAndNavigate}>
                <div className="text-blue-400 mb-1 group-hover:scale-110 transition-transform"><i className="fas fa-list-alt text-lg"></i></div>
                <span className="text-xs text-slate-300 font-medium">Reports</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 hover:border-emerald-500/30 transition-all group" onClick={closePanelAndNavigate}>
                 <div className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform"><i className="fas fa-user-circle text-lg"></i></div>
                 <span className="text-xs text-slate-300 font-medium">Profile</span>
            </Link>
            <Link to="/home" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 hover:border-amber-500/30 transition-all group" onClick={closePanelAndNavigate}>
                <div className="text-amber-400 mb-1 group-hover:scale-110 transition-transform"><i className="fas fa-home text-lg"></i></div>
                <span className="text-xs text-slate-300 font-medium">Home</span>
            </Link>
            <Link to="/departmentalReports" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 hover:border-rose-500/30 transition-all group text-center" onClick={closePanelAndNavigate}>
                <div className="text-rose-400 mb-1 group-hover:scale-110 transition-transform"><i className="fas fa-building text-lg"></i></div>
                <span className="text-[10px] text-slate-300 font-medium leading-tight">Dept.<br/>Reports</span>
            </Link>
        </div>
        
        <div className="border-t border-slate-700/50 pt-3">
            <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-semibold transition-colors" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    </div>
  );

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0 flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight hidden sm:block">
              Janta Garage
            </span> 
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link to="/home" className={`px-3 py-2 rounded-md transition-colors ${location.pathname === "/home" ? "text-white bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>
              <span className="hidden sm:inline text-sm font-medium">Home</span>
              <span className="sm:hidden text-lg" title="Home"><i className="fas fa-home"></i></span>
            </Link>
            <Link to="/notifications" className={`px-3 py-2 rounded-md transition-colors ${location.pathname === "/notifications" ? "text-white bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>
              <span className="hidden md:inline text-sm font-medium">Reports For Verification</span>
              <span className="hidden sm:inline md:hidden text-sm font-medium">Verify</span>
              <span className="sm:hidden text-lg" title="Reports For Verification"><i className="fas fa-clipboard-check"></i></span>
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3 ml-2 relative"> 
                {/* Notification Toggle */}
                <button
                    ref={notificationButtonRef}
                    className={`relative p-2 rounded-full transition-colors ${isNotificationPanelOpen ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    onClick={handleNotificationClick}
                    title="Notifications"
                >
                    <i className="fas fa-bell text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 border border-slate-900 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.8)]">
                        {unreadCount}
                      </span>
                    )}
                </button>

                {isNotificationPanelOpen && <NotificationPanel />}

                {/* Profile Toggle */}
                <button 
                    ref={profileButtonRef}
                    className={`flex items-center justify-center rounded-full transition-transform hover:scale-105 ${isPanelOpen ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''}`} 
                    onClick={handleProfileClick}
                    title={`Hello, ${user.name || user.userName}`}
                >
                  {getUserAvatar()}
                </button>
                
                {isPanelOpen && <UserPanel />}
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link to="/login" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/login" ? "text-white bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>Login</Link>
                <Link to="/signup" className={`px-4 py-2 rounded-md text-sm font-medium transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]`}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;