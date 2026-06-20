import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { getAssignedReportsForStaff } from '../services/UserServices';
import { updateStatusToInProgress, updateStatusToResolvedNotification } from '../services/reportService';
import Navbar from './navbar';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Severity priority map for sorting (High -> Medium -> Low)
const SEVERITY_ORDER = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
};

const labelize = (raw) => {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Overdue status is handled via database and Socket.IO events.

// --- Report Detail Modal ---
const ReportDetailModal = ({ report, onClose, onStatusChange }) => {
    
    // Data preparation
    const coords = report.location?.coordinates;
    const locationLink = coords 
        ? `https://maps.google.com/?q=${coords[1]},${coords[0]}` 
        : null;

    // Status checks
    const isProgressVisible = report.status === 'OPEN';
    const isResolveVisible = report.status === 'IN_PROGRESS' && !report.isNotifiedTOResolved;
    const showWaitingMessage = report.status === 'IN_PROGRESS' && report.isNotifiedTOResolved;

    // Deadline formatting - Using toLocaleString for full date/time precision
    const formattedDeadline = report.deadline ? new Date(report.deadline).toLocaleString() : 'N/A';

    const statusColors = {
        'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'open': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };

    const severityColors = {
        'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };

    // --- Handlers ---
    
    const handleMarkInProgress = async () => {
        if (!window.confirm(`Are you sure you want to mark report #${report._id.substring(0, 8)} as 'IN PROGRESS'?`)) {
            return;
        }

        try {
            await updateStatusToInProgress(report._id);
            onStatusChange('success', `Report #${report._id.substring(0, 8)} marked IN PROGRESS.`);
        } catch (error) {
            onStatusChange('error', error.message || 'Failed to update status.');
        }
    };
    
    const handleNotifyCreator = async () => {
        if (!window.confirm(`Confirm resolution of report #${report._id.substring(0, 8)}? This will send a verification email to the creator.`)) {
            return;
        }

        try {
            const message = await updateStatusToResolvedNotification(report._id);
            onStatusChange('info', message); 
        } catch (error) {
            onStatusChange('error', error.message || 'Failed to send notification.');
        }
    };


    return (
        <Modal
            isOpen={true}
            onRequestClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
            overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
        >
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 pr-8">{report.title}</h2>
                        <p className="text-xs text-slate-400 font-mono">
                            ID: {report._id?.substring(0,8)}
                        </p>
                    </div>
                    <button 
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors absolute top-6 right-6"
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    
                    {report.image?.url && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
                            <img src={report.image.url} alt="Report Image" className="w-full h-auto max-h-[300px] object-contain" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Status</span>
                            <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider inline-block mt-1 ${
                                statusColors[(report.status || "open").toLowerCase().replace(/_/g, "-")] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}>
                                {labelize(report.status)}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Severity</span>
                            <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider inline-block mt-1 ${
                                severityColors[(report.severity || "low").toLowerCase()] || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                                {labelize(report.severity)}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Deadline</span>
                            <span className={`font-medium text-sm block mt-1 ${report.isOverdue ? 'text-rose-400' : 'text-white'}`}>
                                {formattedDeadline}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Filed On</span>
                            <span className="font-medium text-sm text-white block mt-1">
                                {new Date(report.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Description</p>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {report.description || 'No description provided.'}
                            </p>
                        </div>
                        
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Departments</p>
                            <div className="flex flex-wrap gap-2">
                                {report.departments?.map((dept, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium">
                                        {dept}
                                    </span>
                                )) || <span className="text-slate-500 text-sm">None</span>}
                            </div>
                        </div>

                        {report.location && (
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Coordinates</p>
                                    <p className="font-mono text-sm text-emerald-400">
                                        {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                                    </p>
                                </div>
                                {locationLink && (
                                    <a href={locationLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
                                        <i className="fas fa-map-marker-alt"></i> View on Map
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-700/50 bg-slate-900/50 flex flex-wrap gap-3 justify-end items-center">
                    {/* 1. Mark In Progress Button (OPEN -> IN_PROGRESS) */}
                    {isProgressVisible && (
                        <button 
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2 mr-auto" 
                            onClick={handleMarkInProgress}
                        >
                            <i className="fas fa-play"></i> Mark In Progress
                        </button>
                    )}
                    
                    {/* 2. Notify Creator Button (IN_PROGRESS & NOTIFIED=FALSE) */}
                    {isResolveVisible && (
                        <button 
                            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2 mr-auto" 
                            onClick={handleNotifyCreator}
                        >
                            <i className="fas fa-paper-plane"></i> Notify Creator for Resolution
                        </button>
                    )}
                    
                    {/* 3. Waiting Message (IN_PROGRESS & NOTIFIED=TRUE) */}
                    {showWaitingMessage && (
                        <span className="text-amber-400 text-sm font-medium flex items-center gap-2 mr-auto px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                            <i className="fas fa-hourglass-half"></i> Notification sent. Awaiting creator...
                        </span>
                    )}

                    <button 
                        className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- Report Card Component ---
const AssignedReportCard = ({ report, onClick }) => {
    const statusClass = (report.status || 'Pending').toLowerCase().replace(/_/g, '-');
    const severityClass = (report.severity || 'Low').toLowerCase();
    const reportDate = new Date(report.createdAt).toLocaleDateString('en-GB');

    const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
    const isOverdue = !!report.isOverdue;

    const statusColors = {
        'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'open': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };

    const severityColors = {
        'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };

    return (
        <div 
            className={`glass-card cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden ${isOverdue ? 'ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : ''}`}
            onClick={() => onClick(report)}
            role="button"
            tabIndex={0}
        >
            {isOverdue && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
                    <div className="absolute top-2 -right-6 bg-rose-500 text-white text-[9px] font-bold py-1 px-8 transform rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        OVERDUE
                    </div>
                </div>
            )}
            
            <div className="h-40 w-full overflow-hidden bg-slate-900 border-b border-slate-700/50 relative group-hover:opacity-90 transition-opacity">
                {report.image?.url ? (
                    <img src={report.image.url} alt={report.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <i className="fas fa-image text-3xl mb-2"></i>
                        <span className="text-sm font-medium">No Image</span>
                    </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
            </div>
            
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{report.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 bg-slate-800/40 p-2 rounded border border-slate-700/30">
                    <i className="far fa-calendar-alt text-slate-500"></i>
                    <span>Filed: <span className="text-slate-300">{reportDate}</span></span>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-slate-700/50">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[statusClass] || statusColors['open']}`}>
                        {labelize(report.status)}
                    </span>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                            <i className="far fa-clock"></i> 
                            <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>Due: {deadlineText}</span>
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${severityColors[severityClass]?.split(' ')[0] || 'bg-slate-500'} border ${severityColors[severityClass]?.split(' ')[2] || 'border-slate-500'} shadow-[0_0_5px_currentColor]`} title={`Severity: ${labelize(report.severity)}`}></span>
                    </div>
                </div>
            </div>
        </div>
    );
};


import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- Main Component ---
const AssignedReports = () => {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); 
    
    const isStaff = user?.role === 'staff';

    const { data: reports = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ["reports", "assigned"],
        queryFn: getAssignedReportsForStaff,
        enabled: !authLoading && !!user && isStaff,
    });

    useEffect(() => {
        if (queryError) {
            setError(queryError.message);
        } else {
            setError(null);
        }
    }, [queryError]);

    // --- SORTING AND SPLITTING LOGIC (Use useMemo to optimize) ---
    const { activeReports, pastReports } = useMemo(() => {
        // 1. Separate Reports based on status
        const unresolved = reports.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
        const past = reports.filter(r => r.status === 'Resolved' || r.status === 'CLOSED');

        // 2. Prioritize Unresolved Reports (Severity -> Deadline Time -> Date)
        const sortedUnresolved = unresolved.sort((a, b) => {
            const orderA = SEVERITY_ORDER[a.severity] || 99;
            const orderB = SEVERITY_ORDER[b.severity] || 99;
            
            // Primary Sort: Severity (High first)
            if (orderA !== orderB) return orderA - orderB;
            
            // Secondary Sort: Deadline Time (Earliest deadline first)
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

            if (deadlineA !== deadlineB) {
                // Infinity (no deadline) goes last. Earliest deadline goes first.
                return deadlineA - deadlineB;
            }
            
            // Tertiary Sort: Creation Date (Newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // 3. Sort Past Reports (Date)
        const sortedPast = past.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return { activeReports: sortedUnresolved, pastReports: sortedPast };
    }, [reports]);

    // Effect for status message timeout
    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => setStatusMessage({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    // Handler passed to modal to refresh data after assignment
    const handleStatusUpdate = useCallback((type, message) => {
        setStatusMessage({ type, message });
        setSelectedReport(null); // Close the modal
        
        // Refresh the list instantly using react query
        queryClient.invalidateQueries({ queryKey: ["reports", "assigned"] }); 
    }, [queryClient]);



    // --- Render Guards ---

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-slate-400">Authenticating user...</p>
                </div>
            </div>
        );
    }
    
    if (!isStaff) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh]">
                    <div className="glass-card p-8 text-center text-rose-400 font-bold border-rose-500/30 max-w-md">
                        <i className="fas fa-lock text-3xl mb-3 block"></i>
                        <h2 className="text-xl mb-2">Access Denied (403)</h2>
                        <p className="text-slate-400 font-normal">This page is reserved for <span className="text-white font-medium">Staff</span> members to manage assigned tasks.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-slate-400">Fetching your assigned reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                
                <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Staff Task <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Dashboard</span></h1>
                    <p className="text-slate-400 text-lg max-w-3xl">
                        Managing <span className="text-white font-bold">{activeReports.length + pastReports.length}</span> reports assigned to <span className="text-white font-bold">{user.name || user.userName}</span>.
                    </p>
                </header>
                
                {/* Global Status Message Display */}
                {statusMessage.message && (
                    <div className={`mb-8 p-4 rounded-lg border font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                        statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        statusMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                        'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                        <i className={`fas ${statusMessage.type === 'success' ? 'fa-check-circle' : statusMessage.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
                        {statusMessage.message}
                    </div>
                )}
                
                {/* --- 1. UNRESOLVED REPORTS (PRIORITIZED) --- */}
                <section className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Active Tasks <span className="text-slate-500 text-lg ml-2 font-normal">({activeReports.length})</span></h2>
                        <div className="h-px bg-slate-800 flex-grow ml-4"></div>
                    </div>
                    
                    {(activeReports.length > 0) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center border-dashed border-slate-700/50 flex flex-col items-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                                <i className="fas fa-mug-hot text-4xl text-emerald-500/70"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                            <p className="text-slate-400">No issues are currently pending action. Time for a coffee break!</p>
                        </div>
                    )}
                </section>
                
                {/* --- 2. RESOLVED / PAST REPORTS --- */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
                    <div className="flex items-center gap-3 mb-6 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                            <i className="fas fa-history"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-300">Resolved/Past Tasks <span className="text-slate-500 text-sm ml-2 font-normal">({pastReports.length})</span></h2>
                        <div className="h-px bg-slate-800 flex-grow ml-4"></div>
                    </div>
                    
                    {(pastReports.length > 0) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
                            {pastReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center border-dashed border-slate-700/50 opacity-70">
                            <i className="fas fa-archive text-3xl text-slate-600 mb-3 block"></i>
                            <p className="text-slate-500">No reports have been resolved yet.</p>
                        </div>
                    )}
                </section>
            </main>
            
            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportDetailModal 
                    report={selectedReport} 
                    onClose={() => setSelectedReport(null)}
                    onStatusChange={handleStatusUpdate} // Pass handler for actions
                />
            )}
        </div>
    );
};

export default AssignedReports;
