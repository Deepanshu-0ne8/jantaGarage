import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { getAssignedReportsForStaff } from '../services/UserServices';
import { updateStatusToInProgress, updateStatusToResolvedNotification } from '../services/reportService';
import Navbar from './navbar';
import Modal from 'react-modal';
import './assignedReports.css';

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

// --- Report Detail Modal (Unchanged Logic) ---
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
            className="report-modal"
            overlayClassName="report-overlay"
        >
            <div className="report-popup">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2 className="modal-title">{report.title}</h2>
                
                {report.image?.url && <img src={report.image.url} alt="Report Image" className="modal-img" />}

                <div className="modal-content-grid">
                    <p className="modal-detail">
                        <strong>Status:</strong>{" "}
                        <span className={`status-badge status-${(report.status || "").toLowerCase().replace(/_/g, "-")}`}>
                            {labelize(report.status)}
                        </span>
                    </p>
                    <p className="modal-detail">
                        <strong>Severity:</strong>{" "}
                        <span className={`severity-chip severity-${(report.severity || "").toLowerCase()}`}>
                            {labelize(report.severity)}
                        </span>
                    </p>
                    <p className="modal-detail full-row">
                        <strong>Filed On:</strong> {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <p className="modal-detail full-row description">
                        <strong>Description:</strong> {report.description || 'No description provided.'}
                    </p>
                    
                    <p className="modal-detail full-row">
                        <strong>Departments:</strong> {report.departments?.join(", ")}
                    </p>
                    
                    {/* Location Details */}
                    {report.location && (
                        <>
                            <p className="modal-detail full-row">
                                <strong>Coordinates:</strong>{" "}
                                {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                            </p>
                            {locationLink && (
                                <p className="modal-detail full-row">
                                    <strong>Map:</strong>{" "}
                                    <a href={locationLink} target="_blank" rel="noopener noreferrer" className="map-link">
                                        View Location <i className="fas fa-map-marker-alt"></i>
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className="report-task-actions">
                    {/* 1. Mark In Progress Button (OPEN -> IN_PROGRESS) */}
                    {isProgressVisible && (
                        <button className="task-action-btn action-in-progress" onClick={handleMarkInProgress}>
                            Mark In Progress
                        </button>
                    )}
                    
                    {/* 2. Notify Creator Button (IN_PROGRESS & NOTIFIED=FALSE) */}
                    {isResolveVisible && (
                        <button className="task-action-btn action-resolve" onClick={handleNotifyCreator}>
                            Notify Creator for Resolution
                        </button>
                    )}
                    
                    {/* 3. Waiting Message (IN_PROGRESS & NOTIFIED=TRUE) */}
                    {showWaitingMessage && (
                        <span className="task-waiting-message">
                            Notification sent. Awaiting creator response...
                        </span>
                    )}

                    <button className="close-btn" onClick={onClose}>Close Details</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Report Card Component (Unchanged) ---
const AssignedReportCard = ({ report, onClick }) => {
    const statusClass = (report.status || 'Pending').toLowerCase().replace(/_/g, '-');
    const severityClass = (report.severity || 'Low').toLowerCase();
    const reportDate = new Date(report.createdAt).toLocaleDateString('en-GB');

    return (
        <div 
            className={`report-card-item status-${statusClass}`} 
            onClick={() => onClick(report)}
            role="button"
            tabIndex={0}
        >
            <div className="card-image-wrapper">
                {report.image?.url ? (
                    <img src={report.image.url} alt={report.title} className="report-img" />
                ) : (
                    <div className="no-img">No Image</div>
                )}
            </div>
            
            <div className="card-content">
                <h3 className="card-title">{report.title}</h3>
                <p className="card-date">Filed: {reportDate}</p>
                <div className="card-footer">
                    <span className={`status-badge status-${statusClass}`}>
                        {labelize(report.status)}
                    </span>
                    <span className={`severity-chip severity-${severityClass}`}>
                        {labelize(report.severity)}
                    </span>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
const AssignedReports = () => {
    const { user, loading: authLoading } = useAuth();
    // Replaced [reports, setReports] with activeReports and pastReports states
    const [activeReports, setActiveReports] = useState([]); 
    const [pastReports, setPastReports] = useState([]);     
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); 

    const isStaff = user?.role === 'staff';

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const fetchedReports = await getAssignedReportsForStaff(); 
            const allReports = fetchedReports || [];
            
            // 1. Separate Reports
            const unresolved = allReports.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
            const past = allReports.filter(r => r.status === 'Resolved' || r.status === 'CLOSED');

            // 2. Prioritize Unresolved Reports (Severity -> Date)
            const sortedUnresolved = unresolved.sort((a, b) => {
                const orderA = SEVERITY_ORDER[a.severity] || 99;
                const orderB = SEVERITY_ORDER[b.severity] || 99;
                
                // Primary Sort: Severity (High first)
                if (orderA !== orderB) return orderA - orderB;
                
                // Secondary Sort: Date (Newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // 3. Sort Past Reports (Date)
            const sortedPast = past.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            setActiveReports(sortedUnresolved);
            setPastReports(sortedPast);

        } catch (err) {
            setError(err.message);
            setActiveReports([]);
            setPastReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect for status message timeout
    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => setStatusMessage({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);
    
    // Effect for initial load
    useEffect(() => {
        if (authLoading || !user) return;
        
        if (isStaff) {
            fetchReports();
        } else {
            setLoading(false);
        }
    }, [user, authLoading, isStaff, fetchReports]);

    // Handler passed to modal to refresh data after assignment
    const handleStatusUpdate = useCallback((type, message) => {
        setStatusMessage({ type, message });
        setSelectedReport(null); // Close the modal
        
        // Refresh the list instantly to show new status/notification field
        fetchReports(); 
    }, [fetchReports]);


    // --- Render Guards ---

    if (authLoading) {
        return (
            <>
                <Navbar />
                <div className="page-container loading-state">Authenticating user...</div>
            </>
        );
    }
    
    if (!isStaff) {
        return (
            <>
                <Navbar />
                <div className="page-container access-denied">
                    <h2>Access Denied (403)</h2>
                    <p>This page is reserved for **Staff** members to manage assigned tasks.</p>
                </div>
            </>
        );
    }
    
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="page-container loading-state">Fetching your assigned reports...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page-wrapper">
                
                <header className="page-header">
                    <h1>Staff Task Dashboard</h1>
                    <p>Managing {activeReports.length + pastReports.length} reports assigned to **{user.name || user.userName}**.</p>
                </header>
                
                {/* Global Status Message Display */}
                {statusMessage.message && (
                    <div className={`status-alert alert-${statusMessage.type}`}>
                        {statusMessage.message}
                    </div>
                )}
                
                {/* --- 1. UNRESOLVED REPORTS (PRIORITIZED) --- */}
                <section className="report-section active-tasks">
                    <h2>Active Tasks ({activeReports.length})</h2>
                    
                    {(activeReports.length > 0) ? (
                        <div className="reports-grid">
                            {activeReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                         <div className="no-reports-message">
                            <i className="fas fa-clipboard-check"></i>
                            <p>No issues are currently pending action. Time for a coffee break!</p>
                        </div>
                    )}
                </section>
                
                {/* --- 2. RESOLVED / PAST REPORTS --- */}
                <section className="report-section past-tasks">
                    <h2>Resolved/Past Tasks ({pastReports.length})</h2>
                    
                    {(pastReports.length > 0) ? (
                         <div className="reports-grid">
                            {pastReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                         <div className="no-reports-message mini-message">
                            <i className="fas fa-history"></i>
                            <p>No reports have been resolved yet.</p>
                        </div>
                    )}
                </section>
            </div>
            
            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportDetailModal 
                    report={selectedReport} 
                    onClose={() => setSelectedReport(null)}
                    onStatusChange={handleStatusUpdate} // Pass handler for actions
                />
            )}
        </>
    );
};

export default AssignedReports;
