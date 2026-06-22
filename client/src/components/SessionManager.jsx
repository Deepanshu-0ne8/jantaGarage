import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/authContext';

const SessionManager = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth(); 

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/sessions');
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleLogoutDevice = async (sessionId) => {
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            fetchSessions();
        } catch (error) {
            console.error("Failed to logout device:", error);
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm("Are you sure you want to log out from all devices?")) return;
        try {
            await api.post('/auth/logout-all');
            logout(); 
        } catch (error) {
            console.error("Failed to logout all devices:", error);
        }
    };

    if (loading) return <div className="text-slate-400 mt-6 animate-pulse">Loading active sessions...</div>;

    return (
        <section className="glass-card p-6 md:p-8 mt-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <i className="fas fa-desktop text-blue-400"></i> Active Sessions
                </h3>
                <button onClick={handleLogoutAll} className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-semibold transition-colors border border-rose-500/30">
                    Logout All Devices
                </button>
            </div>
            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <p className="text-slate-500 italic">No active sessions found.</p>
                ) : (
                    sessions.map(session => (
                        <div key={session._id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    {session.deviceName || 'Unknown Device'}
                                </h4>
                                <p className="text-sm text-slate-400">{session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}</p>
                                <p className="text-xs text-slate-500 mt-1">IP: {session.ipAddress} • Last active: {new Date(session.lastUsedAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleLogoutDevice(session._id)} className="px-4 py-2 border border-slate-600 text-slate-300 hover:text-rose-400 hover:border-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs font-semibold whitespace-nowrap">
                                Logout Device
                            </button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default SessionManager;
