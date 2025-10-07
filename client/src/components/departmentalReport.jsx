import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { getDepartmentalReports, updateStatusToInProgress, updateStatusToResolvedNotification } from '../services/reportService'; 
import './departmentalReport.css';
import Navbar from './navbar'; 

const AttachmentModal = ({ imageUrl, onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="attachment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h3>Report Attachment</h3>
                
                {imageUrl ? (
                    <div className="attachment-viewer">
                        <div className="attachment-item">
                            <img src={imageUrl} alt="Report Attachment" className="attachment-image" />
                        </div>
                    </div>
                ) : (
                    <p className="no-attachments">No image was attached to this report.</p>
                )}
            </div>
        </div>
    );
};


const ReportItem = ({ report, onReportStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const reportDetails = {
        locationLink: report.location?.coordinates ? 
            `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}` : 
            '#',
        id: report._id,
        title: report.title,
        description: report.description,
        severity: report.severity,
        departments: report.departments,
        status: report.status,
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

    const attachmentCount = reportDetails.imageUrl ? 1 : 0;
    
    const isProgressVisible = reportDetails.status === 'OPEN';
    
    const showResolveButton = reportDetails.status === 'IN_PROGRESS' && !reportDetails.isNotified;
    
    const showWaitingMessage = reportDetails.status === 'IN_PROGRESS' && reportDetails.isNotified;

    
    const handleMarkInProgress = async (e) => {
        e.stopPropagation();
        
        if (!window.confirm(`Are you sure you want to mark report #${reportDetails.id.substring(0, 8)} as 'IN PROGRESS'?`)) {
            return;
        }

        try {
            await updateStatusToInProgress(reportDetails.id);
            // Notify parent to refresh list as status has changed in DB
            onReportStatusChange('success', `Report #${reportDetails.id.substring(0, 8)} marked IN PROGRESS.`);
        } catch (error) {
            console.error("Status Update Failed:", error);
            onReportStatusChange('error', error.message || 'Failed to update status.');
        }
    };
    
    const handleNotifyCreator = async (e) => {
        e.stopPropagation();
        
        if (!window.confirm(`Confirm resolution of report #${reportDetails.id.substring(0, 8)}? This will send a verification email to the creator.`)) {
            return;
        }

        try {
            const message = await updateStatusToResolvedNotification(reportDetails.id);
            
            onReportStatusChange('info', message); 
            
        } catch (error) {
            console.error("Resolution Notification Failed:", error);
            onReportStatusChange('error', error.message || 'Failed to send resolution notification.');
        }
    };


    return (
        <>
            <div className="report-card">
                <div className="report-summary" onClick={() => setIsOpen(!isOpen)}>
                    <div className="report-id-info">
                        <span className="report-id"># {reportDetails.id?.substring(0, 8) || 'N/A'}</span>
                        <h3 className="report-title">{reportDetails.title || 'Untitled Report'}</h3>
                    </div>
                    <div className="report-meta">
                        <span className={`report-status status-${statusClass}`}>{reportDetails.status}</span>
                        <span className="report-date">{reportDate}</span>
                        <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
                    </div>
                </div>
                
                {isOpen && (
                    <div className="report-details">
                        <div className="details-grid">
                            
                            {/* Row 1: ID & Status */}
                            <p className="detail-field half-width"><span className="detail-label">Report ID:</span> {reportDetails.id}</p>
                            <p className="detail-field half-width"><span className="detail-label">Status:</span> <span className={`report-status status-${statusClass}`}>{reportDetails.status}</span></p>

                            {/* Row 2: Severity & Created At */}
                            <p className="detail-field half-width"><span className="detail-label">Severity:</span> <span className={`severity-${reportDetails.severity.toLowerCase()}`}>{reportDetails.severity}</span></p>
                            <p className="detail-field half-width"><span className="detail-label">Reported On:</span> {new Date(report.createdAt).toLocaleString()}</p>
                            
                            {/* Row 3: Description */}
                            <p className="detail-field full-width"><span className="detail-label">Description:</span> {reportDetails.description || 'No detailed description provided.'}</p>
                            
                            {/* Row 4: Location (Coordinates & Map Link) */}
                            <p className="detail-field half-width"><span className="detail-label">Coordinates:</span> {report.location?.coordinates?.join(', ') || 'N/A'}</p>
                            <p className="detail-field half-width"><span className="detail-label">Map:</span> <a href={reportDetails.locationLink} target="_blank" rel="noopener noreferrer" className="map-link">View Location <i className="fas fa-external-link-alt"></i></a></p>
                            
                            {/* Row 5: Departments */}
                             <p className="detail-field full-width">
                                <span className="detail-label">Assigned Depts:</span> 
                                <div className="department-tags">
                                    {reportDetails.departments?.map((dept, index) => (
                                        <span key={index} className="dept-tag">{dept.split(' ')[0]}</span>
                                    )) || <span className="dept-tag-none">None</span>}
                                </div>
                            </p>
                            
                            {/* Row 6: Last Updated */}
                            <p className="detail-field full-width">
                                <span className="detail-label">Last Updated:</span> {new Date(report.updatedAt).toLocaleString()}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="report-actions">
                            <button 
                                className="action-button primary-action" 
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                disabled={!attachmentCount}
                            >
                                <i className="fas fa-camera"></i> View Image ({attachmentCount})
                            </button>
                            
                            {/* Mark In Progress Button (Only visible if OPEN) */}
                            {isProgressVisible && (
                                <button 
                                    className="action-button secondary-action status-action-in-progress"
                                    onClick={handleMarkInProgress} 
                                >
                                    Mark In Progress
                                </button>
                            )}
                            
                            {/* Resolution Button/Message */}
                            {showResolveButton && (
                                <button 
                                    className="action-button secondary-action status-action-resolved"
                                    onClick={handleNotifyCreator}
                                >
                                    Notify Creator for Resolution update
                                </button>
                            )}
                            
                            {showWaitingMessage && (
                                <span className="resolution-waiting-message">
                                    Notification sent. Awaiting creator verification...
                                </span>
                            )}
                            
                            {/* Re-open Button (If Resolved) - Placeholder action */}
                            {(reportDetails.status === 'Resolved') && (
                                <button className="action-button secondary-action status-action-reopen">Re-open</button>
                            )}
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
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); // For status updates

    const isAuthorized = user?.role === 'staff' || user?.role === 'admin';

    const fetchReports = useCallback(async () => {
        setLoading(true);
        if (error && error.includes("reports found")) setError(null); 
        
        try {
            const fetchedReports = await getDepartmentalReports();
            setReports(fetchedReports);
            setError(null); 
        } catch (err) {
            setError(err.message);
            setReports([]); 
        } finally {
            setLoading(false);
        }
    }, [error]); 

    useEffect(() => {
        if (authLoading || !user || !isAuthorized) return;
        fetchReports();
    }, [user, authLoading, isAuthorized, fetchReports]);


    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => setStatusMessage({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);


    const handleReportStatusChange = useCallback((type, message) => {
        setStatusMessage({ type, message });
        
        if (type === 'success' || type === 'info') { 
             fetchReports();
        }
    }, [fetchReports]);


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
                            ? 'Showing ALL reports in the system.' 
                            : `Showing reports assigned to: **${user.departments?.join(', ') || 'N/A'}**`
                        }
                    </p>
                </div>

                <div className="report-list">
                    {reports.map(report => (
                        <ReportItem 
                            key={report._id} 
                            report={report} 
                            onReportStatusChange={handleReportStatusChange}
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