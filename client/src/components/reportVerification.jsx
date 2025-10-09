import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
// Import new resolution APIs
import { getReportsForVerification, acceptResolution, rejectResolution } from '../services/reportService'; 
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
                        <img src={imageUrl} alt="Report Attachment" className="attachment-image" />
                    </div>
                ) : (
                    <p className="no-attachments">No image was attached to this report.</p>
                )}
            </div>
        </div>
    );
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


const VerificationReportItem = ({ report, onResolutionAction }) => {
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
        status: report.status, // Should be IN_PROGRESS
        imageUrl: report.image?.url, 
    };

    const reportDate = new Date(report.createdAt).toLocaleDateString();
    
    const statusClass = reportDetails.status ? 
        reportDetails.status.toLowerCase().replace(/_/g, '-') : 
        '';

    const attachmentCount = reportDetails.imageUrl ? 1 : 0;
    
    // --- Handlers for Final Action ---
    const handleAccept = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Confirm resolution? This will mark the report as RESOLVED and remove it from your queue.")) {
            return;
        }

        try {
            const response = await acceptResolution(reportDetails.id); // Call the PATCH /toResolved/:id endpoint
            // Success: Remove item from queue and show message
            onResolutionAction('success', reportDetails.id, response); // response.message is used
        } catch (error) {
            console.error("Accept Failed:", error);
            onResolutionAction('error', reportDetails.id, error.message || 'Failed to verify resolution.');
        }
    };

    const handleReject = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Reject resolution? This will remove the report from your queue and notify staff to try again.")) {
            return;
        }

        try {
            const response = await rejectResolution(reportDetails.id); // Call the PATCH /reject/:id endpoint
            // Success: Remove item from queue and show message
            // Response object contains the message property
            onResolutionAction('info', reportDetails.id, response.message); 
        } catch (error) {
            console.error("Reject Failed:", error);
            onResolutionAction('error', reportDetails.id, error.message || 'Failed to reject resolution.');
        }
    };


    return (
        <>
            <div className="report-card verification-card">
                <div className="report-summary" onClick={() => setIsOpen(!isOpen)}>
                    <div className="report-id-info">
                        <span className="report-id"># {reportDetails.id?.substring(0, 8) || 'N/A'}</span>
                        <h3 className="report-title">{reportDetails.title || 'Untitled Report'}</h3>
                    </div>
                    <div className="report-meta">
                        <span className={`report-status status-${statusClass}`}>ACTION REQUIRED</span>
                        <span className="report-date">{reportDate}</span>
                        <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
                    </div>
                </div>
                
                {isOpen && (
                    <div className="report-details">
                        <div className="details-grid">
                            
                            {/* Detailed Fields */}
                            <p className="detail-field half-width"><span className="detail-label">Report ID:</span> {reportDetails.id}</p>
                            <p className="detail-field half-width"><span className="detail-label">Current Status:</span> <span className={`report-status status-${statusClass}`}>{reportDetails.status}</span></p>

                            <p className="detail-field half-width"><span className="detail-label">Severity:</span> <span className={`severity-${reportDetails.severity.toLowerCase()}`}>{reportDetails.severity}</span></p>
                            <p className="detail-field half-width"><span className="detail-label">Reported On:</span> {new Date(report.createdAt).toLocaleString()}</p>
                            
                            <p className="detail-field full-width"><span className="detail-label">Description:</span> {reportDetails.description || 'No detailed description provided.'}</p>
                            
                            <p className="detail-field half-width"><span className="detail-label">Coordinates:</span> {report.location?.coordinates?.join(', ') || 'N/A'}</p>
                            <p className="detail-field half-width"><span className="detail-label">Map:</span> <a href={reportDetails.locationLink} target="_blank" rel="noopener noreferrer" className="map-link">View Location <i className="fas fa-external-link-alt"></i></a></p>
                            
                             <p className="detail-field full-width">
                                <span className="detail-label">Assigned Depts:</span> 
                                <div className="department-tags">
                                    {reportDetails.departments?.map((dept, index) => (
                                        <span key={index} className="dept-tag">{dept.split(' ')[0]}</span>
                                    )) || <span className="dept-tag-none">None</span>}
                                </div>
                            </p>
                            <p className="detail-field full-width">
                                <span className="detail-label">Last Updated:</span> {new Date(report.updatedAt).toLocaleString()}
                            </p>
                        </div>

                        {/* Verification Actions */}
                        <div className="report-actions verification-actions">
                            <button 
                                className="action-button primary-action" 
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                disabled={!attachmentCount}
                            >
                                <i className="fas fa-camera"></i> View Image ({attachmentCount})
                            </button>
                            
                            <button 
                                className="action-button success-action"
                                onClick={handleAccept}
                            >
                                <i className="fas fa-check-circle"></i> Verify & Accept Resolution
                            </button>
                            
                            <button 
                                className="action-button danger-action"
                                onClick={handleReject}
                            >
                                <i className="fas fa-times-circle"></i> Reject Resolution
                            </button>
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


const ReportVerificationPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); 
    
    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null); 
        
        try {
            const fetchedReports = await getReportsForVerification();
            setReports(fetchedReports);
        } catch (err) {
            // Note: No reports found (404) also sets error, which is handled in the render block
            setError(err.message);
            setReports([]); 
        } finally {
            setLoading(false);
        }
    }, []); 


    useEffect(() => {
        
        if (!authLoading && user) { 
            fetchReports();
        }
    }, [user, authLoading, fetchReports]);


    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => setStatusMessage({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);


    // Handler that removes the resolved/rejected report from the local list
    const handleResolutionAction = useCallback((type, reportId, message) => {
        setStatusMessage({ type, message });
        
        // Remove the report from the local state immediately
        setReports(prevReports => prevReports.filter(r => r._id !== reportId));
        
    }, []);


    // --- Render Guards ---

    if (authLoading || !user) {
        return (
            <>
                <Navbar />
                <div className="report-page-container access-denied">
                    <h2>Authentication Required</h2>
                    <p>Please log in to view this page.</p>
                </div>
            </>
        );
    }
    
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="report-page-container loading-state">Checking for reports requiring your verification...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="report-page-wrapper">
                
                {statusMessage.message && (
                    <div className={`status-alert alert-${statusMessage.type}`}>
                        {statusMessage.message}
                    </div>
                )}
                
                <div className="report-page-header">
                    <h1>Resolution Verification Queue</h1>
                    <p>
                        These reports (filed by you) have been marked resolved by staff and require your final verification.
                    </p>
                </div>

                <div className="report-list">
                    {reports.map(report => (
                        <VerificationReportItem 
                            key={report._id} 
                            report={report} 
                            onResolutionAction={handleResolutionAction}
                        />
                    ))}
                </div>

                {(reports.length === 0 || error) && (
                    <div className="no-reports-message">
                        <i className="fas fa-check-circle"></i>
                        <p>{error || 'No reports currently require your verification. Great news!'}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ReportVerificationPage;
