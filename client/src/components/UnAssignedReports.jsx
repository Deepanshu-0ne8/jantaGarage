import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { getUnassignedReports } from '../services/reportService';
import './UnassignedReportPage.css';
import Navbar from './navbar'; 
import { Link } from 'react-router-dom'; // Import Link for navigation

// Severity priority map for sorting
const SEVERITY_ORDER = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
};

// --- Report Item Component (Simplified for Unassigned List) ---
const UnassignedReportItem = ({ report }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const reportDetails = {
        locationLink: report.location?.coordinates ? 
            `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}` : 
            '#',
        id: report._id,
        title: report.title,
        description: report.description,
        severity: report.severity,
        departments: report.departments,
        reportDate: new Date(report.createdAt).toLocaleDateString(),
    };

    // Severity class for styling
    const severityClass = reportDetails.severity.toLowerCase();

    return (
        <div className="report-card unassigned-card">
            <div className="report-summary" onClick={() => setIsOpen(!isOpen)}>
                <div className="report-id-info">
                    <span className="report-id"># {reportDetails.id?.substring(0, 8) || 'N/A'}</span>
                    <h3 className="report-title">{reportDetails.title || 'Untitled Report'}</h3>
                </div>
                <div className="report-meta">
                    <span className={`report-severity severity-${severityClass}`}>{reportDetails.severity}</span>
                    <span className="report-date">{reportDetails.reportDate}</span>
                    <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
                </div>
            </div>
            
            {isOpen && (
                <div className="report-details">
                    <div className="details-grid">
                        
                        {/* Row 1: Severity & Status (Unassigned status implicit) */}
                        <p className="detail-field half-width"><span className="detail-label">Current Status:</span> <span className="status-unassigned">UNASSIGNED</span></p>
                        <p className="detail-field half-width"><span className="detail-label">Severity:</span> <span className={`severity-${severityClass}`}>{reportDetails.severity}</span></p>
                        
                        {/* Row 2: Description */}
                        <p className="detail-field full-width"><span className="detail-label">Description:</span> {reportDetails.description || 'No detailed description provided.'}</p>
                        
                        {/* Row 3: Departments */}
                         <p className="detail-field full-width">
                            <span className="detail-label">Target Depts:</span> 
                            <div className="department-tags">
                                {reportDetails.departments?.map((dept, index) => (
                                    <span key={index} className="dept-tag">{dept.split(' ')[0]}</span>
                                )) || <span className="dept-tag-none">None</span>}
                            </div>
                        </p>
                        
                        {/* Row 4: Location & Created At */}
                        <p className="detail-field half-width"><span className="detail-label">Coordinates:</span> {report.location?.coordinates?.join(', ') || 'N/A'}</p>
                        <p className="detail-field half-width"><span className="detail-label">Map:</span> <a href={reportDetails.locationLink} target="_blank" rel="noopener noreferrer" className="map-link">View Location <i className="fas fa-external-link-alt"></i></a></p>
                        
                    </div>

                    {/* Action: Assign Button (Now links to StaffList) */}
                    <div className="report-actions">
                        <Link 
                            to={`/staffList?reportId=${reportDetails.id}`}
                            className="action-button primary-action assign-button"
                            onClick={(e) => e.stopPropagation()} // Prevent card collapse when clicking the link
                        >
                            <i className="fas fa-user-tag"></i> Assign to Staff
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
const UnassignedReportsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // CRITICAL: Check user role directly against backend permission (Admin only)
    const isAuthorized = user?.role === 'admin'; 

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const fetchedReports = await getUnassignedReports();
            
            // --- IMPLEMENT SEVERITY SORTING ---
            const sortedReports = fetchedReports.sort((a, b) => {
                const orderA = SEVERITY_ORDER[a.severity] || 99;
                const orderB = SEVERITY_ORDER[b.severity] || 99;
                
                // 1. Primary Sort: Severity (Ascending order based on SEVERITY_ORDER map)
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                
                // 2. Secondary Sort: Creation Date (Newest first, in case of tie in severity)
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // Descending order (newest first)
            });


            setReports(sortedReports);
        } catch (err) {
            setError(err.message);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;
        
        if (isAuthorized) {
            fetchReports();
        } else {
            // If user is logged in but not an admin (Staff/Citizen)
            setLoading(false); 
        }
    }, [user, authLoading, isAuthorized, fetchReports]);


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
    
    if (!isAuthorized) {
        return (
            <>
                <Navbar />
                <div className="report-page-container access-denied">
                    <h2>Access Denied</h2>
                    <p>You must be an **Admin** to view and manage unassigned reports.</p>
                </div>
            </>
        );
    }
    
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="report-page-container loading-state">Fetching unassigned reports...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="report-page-wrapper">
                
                <div className="report-page-header">
                    <h1>Unassigned Reports Queue</h1>
                    <p>Admin View: **{reports.length} reports** currently require staff assignment. Sorted by **Severity**.</p>
                </div>

                <div className="report-list">
                    {reports.map(report => (
                        <UnassignedReportItem key={report._id} report={report} />
                    ))}
                </div>

                {(reports.length === 0 || error) && (
                    <div className="no-reports-message">
                        <i className="fas fa-clipboard-list"></i>
                        <p>{error || 'No unassigned reports found. Great work!'}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default UnassignedReportsPage;
