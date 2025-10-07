import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getDepartmentalReports } from '../services/reportService';
import './departmentalReport.css';

// Component to display a single report item
const ReportItem = ({ report }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Format date for better readability
    const reportDate = new Date(report.createdAt).toLocaleDateString();

    // Check if the report has a status field (mocking it since the Report model isn't provided)
    const status = report.status || 'Pending Review';
    const statusClass = status.toLowerCase().replace(' ', '-');

    return (
        <div className="report-card">
            <div className="report-summary" onClick={() => setIsOpen(!isOpen)}>
                <div className="report-id-info">
                    <span className="report-id"># {report._id?.substring(0, 8) || 'N/A'}</span>
                    <h3 className="report-title">{report.title || 'Untitled Report'}</h3>
                </div>
                <div className="report-meta">
                    <span className={`report-status status-${statusClass}`}>{status}</span>
                    <span className="report-date">{reportDate}</span>
                    <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
                </div>
            </div>
            
            {isOpen && (
                <div className="report-details">
                    <p className="detail-field"><span className="detail-label">Description:</span> {report.description || 'No description provided.'}</p>
                    <p className="detail-field">
                        <span className="detail-label">Departments:</span> 
                        <div className="department-tags">
                            {report.departments?.map((dept, index) => (
                                <span key={index} className="dept-tag">{dept.split(' ')[0]}</span>
                            ))}
                        </div>
                    </p>
                    <p className="detail-field"><span className="detail-label">Location:</span> {report.address || 'Location Unknown'}</p>
                    <p className="detail-field"><span className="detail-label">Reported By:</span> {report.reporterName || 'Anonymous'}</p>
                    
                    {/* Placeholder for actions like "Assign" or "Resolve" */}
                    <div className="report-actions">
                        <button className="action-button primary-action">View Attachments</button>
                        <button className="action-button secondary-action">Resolve</button>
                    </div>
                </div>
            )}
        </div>
    );
};


const DepartmentalReport = () => {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check user authorization based on backend logic
    const isAuthorized = user?.role === 'staff' || user?.role === 'admin';

    useEffect(() => {
        if (authLoading || !user) return;
        
        if (!isAuthorized) {
            setLoading(false);
            return;
        }

        const fetchReports = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedReports = await getDepartmentalReports();
                setReports(fetchedReports);
            } catch (err) {
                // Catches 403 (Unauthorized) or 404 (No reports found) messages from the service
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user, authLoading, isAuthorized]);

    if (authLoading) {
        return <div className="report-page-container loading-state">Authenticating user...</div>;
    }

    if (!isAuthorized) {
        return (
            <div className="report-page-container access-denied">
                <h2>Access Denied</h2>
                <p>You must be a Staff or Admin user to view departmental reports.</p>
            </div>
        );
    }
    
    // Display error message if fetching failed (e.g., 404 No reports found)
    if (error && reports.length === 0) {
         return (
            <div className="report-page-container error-state">
                <h2>{error.includes("reports found") ? "No Reports Found" : "Error Loading Reports"}</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (loading) {
        return <div className="report-page-container loading-state">Fetching departmental reports...</div>;
    }

    return (
        <div className="report-page-wrapper">
            <div className="report-page-header">
                <h1>Departmental Reports Dashboard</h1>
                <p>Showing reports assigned to: **{user.departments?.join(', ') || 'N/A'}**</p>
            </div>

            <div className="report-list">
                {reports.map(report => (
                    // Assumes reports have a unique MongoDB ID (_id)
                    <ReportItem key={report._id} report={report} />
                ))}
            </div>

            {reports.length === 0 && !error && (
                <div className="no-reports-message">
                    <i className="fas fa-search"></i>
                    <p>No reports currently require your department's attention.</p>
                </div>
            )}
        </div>
    );
};

export default DepartmentalReport;