import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/authContext';
// NOTE: Assuming this service function hits the /api/v1/reports/assignedReports route
import { getAssignedReportsByAdmin } from '../services/reportService'; 
import Navbar from './navbar';
import Modal from 'react-modal';
import './AdminAssignedReports.css'; 

// Import constants and helpers from the types file (assuming modular project structure)
import { 
    SEVERITY_ORDER, 
    SEVERITY_OPTIONS, 
    STATUS_OPTIONS, 
    DEPARTMENT_OPTIONS, 
    labelize, 
    getDeadlineClass 
} from './AdminAssignedReports.types.js'; 

Modal.setAppElement('#root');

// --- Attachment Modal Component (New) ---
const AttachmentModal = ({ imageUrl, onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="attachment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
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


// --- Helper Components (Modal and Filter) ---

const ReportFilter = ({ filters, setFilters }) => {
    
    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest('.filter-dropdown-toggle')) {
                setIsDeptDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDeptDropdownOpen]);

    const handleChange = (field) => (e) => {
        setFilters(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleDepartmentChange = (dept) => {
        setFilters(prev => ({ 
            ...prev, 
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleReset = () => {
        setFilters({ severity: '', status: '', departments: [] });
    };
    
    const selectedDeptCount = filters.departments.length;
    const departmentToggleText = selectedDeptCount > 0 ? `${selectedDeptCount} Selected` : 'Filter by Department';

    return (
        <div className="reports-filter-bar">
            <div className="filter-group">
                <label className="filter-label">Severity</label>
                <select value={filters.severity} onChange={handleChange('severity')}>
                    <option value="">All</option>
                    {SEVERITY_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            <div className="filter-group">
                <label className="filter-label">Status</label>
                <select value={filters.status} onChange={handleChange('status')}>
                    <option value="">All</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            <div className="filter-group department-filter-group">
                <label className="filter-label">Department</label>
                <button 
                    type="button"
                    className={`filter-dropdown-toggle ${isDeptDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsDeptDropdownOpen(prev => !prev)}
                >
                    {departmentToggleText}
                </button>
                
                {isDeptDropdownOpen && (
                    <div ref={dropdownRef} className="department-dropdown">
                        {DEPARTMENT_OPTIONS.map(d => (
                            <div key={d} className="dropdown-item" onClick={() => handleDepartmentChange(d)}>
                                <input
                                    type="checkbox"
                                    checked={filters.departments.includes(d)}
                                    readOnly 
                                />
                                {d}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <button className="reset-filter-btn" onClick={handleReset}>
                Reset Filters
            </button>
        </div>
    );
};


const ReportDetailsModal = ({ report, onClose }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false); // State for image viewer
    
    const coords = report.location?.coordinates;
    const locationLink = coords 
        ? `https://maps.google.com/?q=${coords[1]},${coords[0]}` 
        : null;

    const formattedDeadline = report.deadline ? new Date(report.deadline).toLocaleString() : 'N/A';
    const deadlineClass = getDeadlineClass(report.deadline, report.status);

    const attachmentCount = report.image?.url ? 1 : 0;

    return (
        <>
        <Modal
            isOpen={true}
            onRequestClose={onClose}
            className="report-modal"
            overlayClassName="report-overlay"
        >
            <div className="report-popup">
                <button className="modal-close-btn" onClick={onClose}>×</button>
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
                    
                    <p className="modal-detail">
                        <strong>Deadline:</strong>{" "}
                        <span className={`deadline-chip ${deadlineClass}`}>
                            {formattedDeadline}
                        </span>
                    </p>
                    
                    {/* NOTE: Assuming assignedTo field is populated by the API */}
                    <p className="modal-detail full-row">
                        <strong>Assigned To:</strong> {report.assignedTo?.name || report.assignedTo?.userName || 'N/A'}
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
                    <button
                        className="action-button view-image-button"
                        onClick={() => setIsImageModalOpen(true)}
                        disabled={!attachmentCount}
                    >
                        <i className="fas fa-camera"></i> View Image ({attachmentCount})
                    </button>
                    <button className="close-btn" onClick={onClose}>Close Details</button>
                </div>
            </div>
        </Modal>

        {/* Attachment Modal */}
        {isImageModalOpen && (
            <AttachmentModal 
                imageUrl={report.image?.url} 
                onClose={() => setIsImageModalOpen(false)} 
            />
        )}
        </>
    );
};

// --- Report Card Component ---
const AssignedReportCard = ({ report, onClick }) => {
    const statusClass = (report.status || 'Pending').toLowerCase().replace(/_/g, '-');
    const severityClass = (report.severity || 'Low').toLowerCase();

    const deadlineClass = getDeadlineClass(report.deadline, report.status);
    const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
    const isOverdue = deadlineClass === 'deadline-overdue';
    
    // Use updatedAt for resolved reports status if available
    const lastDate = report.status === 'Resolved' || report.status === 'CLOSED'
        ? new Date(report.updatedAt).toLocaleDateString('en-GB')
        : deadlineText;
    
    const dateLabel = report.status === 'Resolved' || report.status === 'CLOSED' ? 'Completed:' : 'Due:';

    // Base card class
    const baseCardClasses = `report-card-item status-${statusClass}`;
    
    // If deadlineClass is empty (resolved), use 'deadline-normal' for the date chip background, 
    // otherwise use the calculated urgency class.
    const deadlineChipClass = deadlineClass || 'deadline-normal';

    return (
        <div 
            // Apply is-overdue ONLY if it's currently active AND overdue
            className={`${baseCardClasses} ${deadlineClass} ${isOverdue ? 'is-overdue' : ''}`} 
            onClick={() => onClick(report)}
            role="button"
            tabIndex={0}
        >
            <div className="card-content">
                <div className="card-header">
                    <h3 className="card-title">{report.title}</h3>
                    {/* Only show OVERDUE tag if currently active AND overdue */}
                    {isOverdue && (
                        <span className="deadline-tag overdue-tag-card">OVERDUE</span>
                    )}
                </div>
                
                <p className="card-assignee">To: **{report.assignedTo?.name || report.assignedTo?.userName || 'N/A'}**</p>
                
                <div className="card-footer">
                    <span className={`status-badge status-${statusClass}`}>
                        {labelize(report.status)}
                    </span>
                    
                    {/* Display deadline or completion date. Uses deadlineChipClass to ensure styling is appropriate. */}
                    <span className={`deadline-chip-card ${deadlineChipClass} date-info`}>
                        {dateLabel} {lastDate}
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
const AdminAssignedReports = () => {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState([]); 
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ severity: '', status: '', departments: [] });
    
    // State for forcing real-time update
    const [realTimeKey, setRealTimeKey] = useState(0);

    const isAuthorized = user?.role === 'admin';

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // NOTE: Assuming getAssignedReportsByAdmin calls the backend route
            const response = await getAssignedReportsByAdmin(); 
            // We assume the API handles population of the 'assignedTo' field for staff name display
            setReports(response || []); 
        } catch (err) {
            // Handle case where no reports are found (404/empty data)
            const errMsg = err.message || "Failed to fetch assigned reports.";
            if (errMsg.includes('404') || errMsg.includes('No assigned reports found')) {
                 setReports([]);
                 setError(null); // Clear error if it's just an empty result
            } else {
                 setError(errMsg);
            }
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- REAL-TIME DEADLINE CHECKER ---
    useEffect(() => {
        let timer;
        const nowTime = new Date().getTime();
        
        // 1. Find the next relevant deadline time among ACTIVE reports
        const nextDeadlineTime = reports.reduce((minTime, report) => {
            // Only consider reports that are OPEN or IN_PROGRESS and have a future deadline
            const isActive = report.status === 'OPEN' || report.status === 'IN_PROGRESS';
            if (!isActive || !report.deadline) return minTime;

            const deadlineTime = new Date(report.deadline).getTime();
            
            // Only consider future deadlines
            if (deadlineTime > nowTime && deadlineTime < minTime) {
                return deadlineTime;
            }
            return minTime;
        }, Infinity);

        if (nextDeadlineTime !== Infinity) {
            // Calculate delay until that specific moment (plus 1 second buffer)
            const delay = nextDeadlineTime - nowTime + 1000;
            
            timer = setTimeout(() => {
                // Force re-evaluation of report statuses by updating the key
                setRealTimeKey(prev => prev + 1); 
            }, delay);
        }
        
        return () => clearTimeout(timer);
    }, [reports, realTimeKey]); 


    // --- FILTERING AND SORTING LOGIC ---
    const { activeReports, pastReports, totalFilteredCount } = useMemo(() => {
        // 1. Apply user filters
        const filtered = reports.filter(report => {
            const severityMatch = filters.severity ? report.severity === filters.severity : true;
            const statusMatch = filters.status ? report.status === filters.status : true;
            
            const departmentMatch = filters.departments.length > 0 
                ? report.departments.some(dept => filters.departments.includes(dept))
                : true;
    
            return severityMatch && statusMatch && departmentMatch;
        });

        // 2. Separate into Active (OPEN/IN_PROGRESS) and Past (Resolved/Closed)
        const unresolved = filtered.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
        const past = filtered.filter(r => r.status === 'Resolved' || r.status === 'CLOSED');

        // 3. Sort Active Reports (Priority: Overdue, Severity, Deadline Time)
        const sortedActive = unresolved.sort((a, b) => {
            const isAOverdue = getDeadlineClass(a.deadline, a.status) === 'deadline-overdue';
            const isBOverdue = getDeadlineClass(b.deadline, b.status) === 'deadline-overdue';

            // Primary Sort: Overdue status (Overdue first)
            if (isAOverdue !== isBOverdue) {
                return isAOverdue ? -1 : 1;
            }

            // Secondary Sort: Severity (High first)
            const orderA = SEVERITY_ORDER[a.severity] || 99;
            const orderB = SEVERITY_ORDER[b.severity] || 99;
            if (orderA !== orderB) return orderA - orderB;
            
            // Tertiary Sort: Deadline Time (Earliest deadline first)
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

            if (deadlineA !== deadlineB) {
                return deadlineA - deadlineB;
            }
            
            // Final Sort: Creation Date (Newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // 4. Sort Past Reports (Newest completion date/update date first)
        const sortedPast = past.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));


        return { 
            activeReports: sortedActive, 
            pastReports: sortedPast,
            totalFilteredCount: filtered.length
        };
    }, [reports, filters, realTimeKey]); 

    // Effect for initial load
    useEffect(() => {
        if (authLoading || !user) return;
        
        if (isAuthorized) {
            fetchReports();
        } else {
            setLoading(false);
        }
    }, [user, authLoading, isAuthorized, fetchReports]);


    // --- Render Guards ---
    if (authLoading) {
        return (
            <>
                <Navbar />
                <div className="page-container loading-state">Authenticating user...</div>
            </>
        );
    }
    
    if (!isAuthorized) {
        return (
            <>
                <Navbar />
                <div className="page-container access-denied">
                    <h2>Access Denied (403)</h2>
                    <p>This page is reserved for **Admin** access only.</p>
                </div>
            </>
        );
    }
    
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="page-container loading-state">Fetching assigned reports...</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page-wrapper">
                
                <header className="page-header">
                    <h1>Reports Assigned By You</h1>
                    <p>Monitoring **{totalFilteredCount}** reports assigned by you.</p>
                </header>
                
                <ReportFilter filters={filters} setFilters={setFilters} />
                
                {/* --- 1. UNRESOLVED/ACTIVE REPORTS SECTION --- */}
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
                        <div className="no-reports-message mini-message">
                            <i className="fas fa-clipboard-check"></i>
                            <p>No active tasks found matching filters.</p>
                        </div>
                    )}
                </section>

                {/* --- 2. RESOLVED / PAST REPORTS SECTION --- */}
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
                            <p>No completed tasks found matching filters.</p>
                        </div>
                    )}
                </section>

                {/* Catch-all for when filters hide everything */}
                {totalFilteredCount === 0 && !error && (
                    <div className="no-reports-message large-message">
                        <i className="fas fa-search"></i>
                        <p>No reports found matching the current filters.</p>
                    </div>
                )}
                {error && (
                    <div className="no-reports-message large-message error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>{error}</p>
                    </div>
                )}
            </div>
            
            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportDetailsModal 
                    report={selectedReport} 
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </>
    );
};

export default AdminAssignedReports;
