import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { getDepartmentalReports } from '../services/reportService'; 
import './departmentalReport.css';
import Navbar from './navbar'; 

const SEVERITY_ORDER = {
  'High': 1,
  'Medium': 2,
  'Low': 3,
};

// Helper to determine deadline chip status, comparing the full timestamp (date + time)
const getDeadlineStatus = (deadlineDate) => {
    if (!deadlineDate) return 'none';

    const nowTime = new Date().getTime();
    const deadlineTime = new Date(deadlineDate).getTime();
    
    const msInDay = 1000 * 60 * 60 * 24;

    // 1. Check if the current time has passed the deadline time
    if (nowTime > deadlineTime) return 'overdue';

    // 2. Calculate remaining time for 'duesoon'
    const diffDays = (deadlineTime - nowTime) / msInDay;

    // Use 'critical' for high urgency instead of 'duesoon' to match standard naming convention (0-1 day remaining)
    if (diffDays <= 1) return 'critical'; 
    if (diffDays <= 3) return 'urgent'; // Use 'urgent' for 1-3 days remaining
    return 'normal';
};


// --- Attachment Modal Component (New) ---
const AttachmentModal = ({ imageUrl, onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="attachment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3>Report Attachment</h3>
                
                {imageUrl ? (
                    <div className="attachment-viewer">
                        <img src={imageUrl} alt="Report Attachment" className="attachment-image" />
                    </div>
                ) : (
                    <p className="no-attachments">No image was attached to this report.</p>
                )}
            </div>
        </div>
    );
};


// Component to display a single report item
const ReportItem = ({ report }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    
    // --- Deadline Calculations ---
    const deadlineStatus = getDeadlineStatus(report.deadline);
    const isOverdue = deadlineStatus === 'overdue';
    const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
    const fullDeadlineText = report.deadline ? new Date(report.deadline).toLocaleString('en-GB') : 'N/A';

    // --- Data Mapping based on Report Schema ---
    const reportDetails = {
        locationLink: report.location?.coordinates ? 
            `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}` : 
            '#',
        id: report._id,
        title: report.title,
        description: report.description,
        severity: report.severity || 'Low',
        departments: report.departments,
        status: report.status || 'OPEN',
        imageUrl: report.image?.url, 
        isNotified: report.isNotifiedTOResolved, 
        history: [
            { date: report.createdAt, note: `Report filed (${report.status})` },
        ],
    };

    const reportDate = new Date(report.createdAt).toLocaleDateString();

    const statusClass = reportDetails.status ? 
        reportDetails.status.toLowerCase().replace(/_/g, '-') : 
        '';
    const severityClass = reportDetails.severity.toLowerCase();

    const attachmentCount = reportDetails.imageUrl ? 1 : 0;
    
    const cardClass = `report-card status-${statusClass} ${isOverdue ? 'is-overdue' : ''}`;
    
    return (
        <>
            <div className={cardClass}>
                <div className="report-summary" onClick={() => setIsOpen(!isOpen)}>
                    <div className="report-id-info">
                        <span className="report-id"># {reportDetails.id?.substring(0, 8) || 'N/A'}</span>
                        <h3 className="report-title">{reportDetails.title || 'Untitled Report'}</h3>
                    </div>
                    <div className="report-meta">
                        
                        {/* NEW: Overdue Tag */}
                        {isOverdue && (
                            <span className="deadline-tag overdue-tag-card">OVERDUE</span>
                        )}

                        <span className={`report-deadline deadline-${deadlineStatus}`}>{deadlineText}</span>

                        <span className={`report-severity severity-${severityClass}`}>{reportDetails.severity}</span>
                        <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
                    </div>
                </div>
                
                {isOpen && (
                    <div className="report-details">
                        <div className="details-grid">
                            
                            {/* Row 1: ID & Status */}
                            <p className="detail-field half-width"><span className="detail-label">Report ID:</span> {reportDetails.id}</p>
                            <p className="detail-field half-width"><span className="detail-label">Status:</span> <span className={`report-status status-${statusClass}`}>{reportDetails.status}</span></p>

                            {/* Row 2: Severity & Deadline */}
                            <p className="detail-field half-width"><span className="detail-label">Severity:</span> <span className={`severity-${severityClass}`}>{reportDetails.severity}</span></p>
                            <p className="detail-field half-width"><span className="detail-label">Target Deadline:</span> <span className={`deadline-text deadline-${deadlineStatus}`}>{fullDeadlineText}</span></p>
                            
                            {/* Row 3: Dates */}
                            <p className="detail-field half-width"><span className="detail-label">Reported On:</span> {new Date(report.createdAt).toLocaleString()}</p>
                            <p className="detail-field half-width"><span className="detail-label">Last Updated:</span> {new Date(report.updatedAt).toLocaleString()}</p>

                            {/* Row 4: Description */}
                            <p className="detail-field full-width"><span className="detail-label">Description:</span> {reportDetails.description || 'No detailed description provided.'}</p>
                            
                            {/* Row 5: Departments */}
                             <p className="detail-field full-width">
                                <span className="detail-label">Assigned Depts:</span> 
                                <div className="department-tags">
                                    {reportDetails.departments?.map((dept, index) => (
                                        <span key={index} className="dept-tag">{dept.split(' ')[0]}</span>
                                    )) || <span className="dept-tag-none">None</span>}
                                </div>
                            </p>
                            
                            {/* Row 6: Location (Coordinates & Map Link) */}
                            <p className="detail-field half-width"><span className="detail-label">Coordinates:</span> {report.location?.coordinates?.join(', ') || 'N/A'}</p>
                            <p className="detail-field half-width"><span className="detail-label">Map:</span> <a href={reportDetails.locationLink} target="_blank" rel="noopener noreferrer" className="map-link">View Location <i className="fas fa-external-link-alt"></i></a></p>
                            
                        </div>

                        {/* Actions (Only View Image remains) */}
                        <div className="report-actions">
                            <button 
                                className="action-button primary-action view-image-button" 
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                disabled={!attachmentCount}
                            >
                                <i className="fas fa-camera"></i> View Image ({attachmentCount})
                            </button>
                            
                            {/* ALL STATUS CHANGE BUTTONS/MESSAGES REMOVED */}
                        </div>
                    </div>
                )}
            </div>

            {/* Attachment Modal */}
            {isModalOpen && (
                <AttachmentModal 
                    imageUrl={reportDetails.imageUrl} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </>
    );
};


const DepartmentalReport = () => {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); 

    const isAuthorized = user?.role === 'staff' || user?.role === 'admin';

    const sortReports = useCallback((fetchedReports) => {
        return fetchedReports.sort((a, b) => {
            const orderA = SEVERITY_ORDER[a.severity] || 99;
            const orderB = SEVERITY_ORDER[b.severity] || 99;

            // Primary Sort: Severity (High first)
            if (orderA !== orderB) return orderA - orderB;
            
            // Secondary Sort: Deadline (Earliest deadline time first)
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            
            if (deadlineA !== deadlineB) {
                // Reports with no deadline go last. Earliest deadline goes first.
                return deadlineA - deadlineB; 
            }

            // Tertiary Sort: Creation Date (Newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, []);


    const fetchReports = useCallback(async () => {
        setLoading(true);
        if (error && error.includes("reports found")) setError(null); 
        
        try {
            const fetchedReports = await getDepartmentalReports();
            const sortedReports = sortReports(fetchedReports || []);
            setReports(sortedReports);
            setError(null); 
        } catch (err) {
            setError(err.message);
            setReports([]); 
        } finally {
            setLoading(false);
        }
    }, [error, sortReports]); 

    useEffect(() => {
        if (authLoading || !user || !isAuthorized) return;
        fetchReports();
    }, [user, authLoading, isAuthorized, fetchReports]);


    // Simplified handler (no longer needs to refresh list based on action, only shows messages)
    const handleReportStatusChange = useCallback((type, message) => {
        setStatusMessage({ type, message });
    }, []);


    // --- Render Guards ---

    if (authLoading) {
        return (
            <>
                <Navbar />
                <div className="report-page-container loading-state">Authenticating user...</div>
            </>
        );
    }

    if (!isAuthorized) {
        return (
            <>
                <Navbar />
                <div className="report-page-container access-denied">
                    <h2>Access Denied</h2>
                    <p>You must be a Staff or Admin user to view departmental reports.</p>
                </div>
            </>
        );
    }
    
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="report-page-container loading-state">Fetching departmental reports...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="report-page-wrapper">
                
                {/* Global Status Message Display */}
                {statusMessage.message && (
                    <div className={`status-alert alert-${statusMessage.type}`}>
                        {statusMessage.message}
                    </div>
                )}
                
                <div className="report-page-header">
                    <h1>Departmental Reports Dashboard</h1>
                    <p>
                        {user.role === 'admin' 
                            ? 'Showing ALL reports in the system (View Only). Sorted by Severity and Deadline.' 
                            : `Showing reports assigned to: **${user.departments?.join(', ') || 'N/A'}** (View Only). Sorted by Severity and Deadline.`
                        }
                    </p>
                </div>

                <div className="report-list">
                    {reports.map(report => (
                        <ReportItem 
                            key={report._id} 
                            report={report} 
                        />
                    ))}
                </div>

                {(reports.length === 0 || error) && (
                    <div className="no-reports-message">
                        <i className="fas fa-search"></i>
                        <p>{error || 'No reports currently require your department\'s attention.'}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default DepartmentalReport;
