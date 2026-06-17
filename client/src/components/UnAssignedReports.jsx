import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { getUnassignedReports } from '../services/reportService';
import './UnassignedReportPage.css';
import Navbar from './navbar'; 
import { Link } from 'react-router-dom';

const SEVERITY_ORDER = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'Resolved'];

const DEPARTMENT_OPTIONS = [
  "Water Supply & Sewage Department",
  "Public Health & Sanitation Department",
  "Roads & Infrastructure Department",
  "Street Lighting Department",
  "Parks & Horticulture Department",
  "Building & Construction Department",
  "Drainage Department",
  "Electricity Department",
  "Public Works Department",
  "Traffic & Transportation Department",
  "Solid Waste Management Department",
  "Animal Control Department",
  "Health & Hospital Services",
  "Fire & Emergency Services",
  "Environmental Department",
  "Revenue Department",
  "Urban Planning & Development Authority",
  "Public Grievance & Complaint Cell",
];

// Overdue status is handled via database and Socket.IO events.


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

const ReportsFilter = ({ filters, setFilters, departmentsList }) => {
    
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

    const handleSeverityChange = (e) => {
        setFilters(prev => ({ ...prev, severity: e.target.value }));
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
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
                <select value={filters.severity} onChange={handleSeverityChange}>
                    <option value="">All</option>
                    {SEVERITY_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            
            <div className="filter-group">
                <label className="filter-label">Status</label>
                <select value={filters.status} onChange={handleStatusChange}>
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
                        {departmentsList.map(d => (
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


const UnassignedReportItem = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOverdue = !!report.isOverdue;
  const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
  const fullDeadlineText = report.deadline ? new Date(report.deadline).toLocaleString('en-GB') : 'N/A';
  
  const reportDetails = {
    locationLink: report.location?.coordinates
      ? `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}`
      : '#',
    id: report._id,
    title: report.title,
    description: report.description,
    severity: report.severity,
    departments: report.departments,
    reportDate: new Date(report.createdAt).toLocaleDateString(),
    imageUrl: report.image?.url,
    deadline: report.deadline,
  };

  const severityClass = reportDetails.severity?.toLowerCase() || 'low';
  const attachmentCount = reportDetails.imageUrl ? 1 : 0;
  const cardClass = `report-card unassigned-card ${isOverdue ? 'overdue-card' : ''}`;


  const handleSummaryClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <>
    <div className={cardClass}>
      <div className="report-summary" onClick={handleSummaryClick}>
        <div className="report-id-info">
          <span className="report-id"># {reportDetails.id?.substring(0, 8) || 'N/A'}</span>
          <h3 className="report-title">{reportDetails.title || 'Untitled Report'}</h3>
        </div>
        <div className="report-meta">
          {isOverdue && (
              <span className="deadline-tag overdue-tag">OVERDUE</span>
          )}
          <span className="report-deadline">{deadlineText}</span>
          <span className={`report-severity severity-${severityClass}`}>{reportDetails.severity}</span>
          <i className={`fas fa-chevron-right chevron ${isOpen ? 'open' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <div className="report-details">
          <div className="details-grid">
            <p className="detail-field half-width">
              <span className="detail-label">Current Status:</span>
              <span className="status-unassigned">UNASSIGNED</span>
            </p>

            <p className="detail-field half-width">
              <span className="detail-label">Severity:</span>
              <span className={`report-severity severity-${severityClass}`}>{reportDetails.severity}</span>
            </p>
            
            <p className="detail-field full-width">
              <span className="detail-label">Target Deadline:</span>
              <span className="deadline-text">{fullDeadlineText}</span>
            </p>

            <p className="detail-field full-width">
              <span className="detail-label">Description:</span>
              {reportDetails.description || 'No detailed description provided.'}
            </p>

            <p className="detail-field full-width">
              <span className="detail-label">Target Depts:</span>
              <div className="department-tags">
                {reportDetails.departments?.length ? (
                  reportDetails.departments.map((dept, index) => (
                    <span key={index} className="dept-tag">
                      {dept.split(' ')[0]}
                    </span>
                  ))
                ) : (
                  <span className="dept-tag-none">None</span>
                )}
              </div>
            </p>

            <p className="detail-field half-width">
              <span className="detail-label">Coordinates:</span>
              {report.location?.coordinates?.join(', ') || 'N/A'}
            </p>

            <p className="detail-field half-width">
              <span className="detail-label">Map:</span>
              <a
                href={reportDetails.locationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
              >
                View Location <i className="fas fa-external-link-alt"></i>
              </a>
            </p>
          </div>

          <div className="report-actions">
            
            <button
                className="action-button primary-action view-image-button"
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                disabled={!attachmentCount}
            >
                <i className="fas fa-camera"></i> View Image ({attachmentCount})
            </button>
            
            <Link
              to={`/staffList?reportId=${reportDetails.id}`}
              className="action-button primary-action assign-button"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fas fa-user-tag"></i> Assign to Staff
            </Link>
          </div>
        </div>
      )}
    </div>
    
    {isModalOpen && (
        <AttachmentModal 
            imageUrl={reportDetails.imageUrl} 
            onClose={() => setIsModalOpen(false)} 
        />
    )}
    </>
  );
};


import { useQuery } from '@tanstack/react-query';

const UnassignedReportsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({ severity: '', status: '', departments: [] });

  const isAuthorized = user?.role === 'admin';

  const { data: reports = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["reports", "unassigned"],
    queryFn: getUnassignedReports,
    enabled: !authLoading && !!user && isAuthorized,
  });

  const error = queryError ? queryError.message : null;

  // Filter, Split, and Sort reports into two sections (runs when reports or filters change)
  const { overdueReports, otherReports } = useMemo(() => {
      // 1. Apply user filters to the master list
      const filtered = reports.filter(report => {
          const severityMatch = filters.severity ? report.severity === filters.severity : true;
          const statusMatch = filters.status ? report.status === filters.status : true; 
          
          const departmentMatch = filters.departments.length > 0 
              ? report.departments.some(dept => filters.departments.includes(dept))
              : true;
  
          return severityMatch && statusMatch && departmentMatch;
      });

      // 2. Separate into Overdue and Others
      const overdue = [];
      const others = [];

      filtered.forEach(report => {
          if (report.isOverdue) {
              overdue.push(report);
          } else {
              others.push(report);
          }
      });

      // 3. Sort Overdue (Primary: Severity only)
      const sortedOverdue = overdue.sort((a, b) => {
          return (SEVERITY_ORDER[a.severity] || 99) - (SEVERITY_ORDER[b.severity] || 99);
      });

      // 4. Sort Others (Primary: Severity; Secondary: Deadline; Tertiary: CreatedAt)
      const sortedOthers = others.sort((a, b) => {
          const orderA = SEVERITY_ORDER[a.severity] || 99;
          const orderB = SEVERITY_ORDER[b.severity] || 99;

          // Primary Sort: Severity (High first)
          if (orderA !== orderB) return orderA - orderB;

          // Secondary Sort: Deadline (Earliest deadline time first - full timestamp)
          const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          if (deadlineA !== deadlineB) {
              return deadlineA - deadlineB; 
          }

          // Tertiary Sort: Creation Date (Newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      return { overdueReports: sortedOverdue, otherReports: sortedOthers };
  }, [reports, filters]);



  const totalFilteredReports = overdueReports.length + otherReports.length;


  if (authLoading || !user)
    return (
      <>
        <Navbar />
        <div className="report-page-container access-denied">
          <h2>Authentication Required</h2>
          <p>Please log in to view this page.</p>
        </div>
      </>
    );

  if (!isAuthorized)
    return (
      <>
        <Navbar />
        <div className="report-page-container access-denied">
          <h2>Access Denied</h2>
          <p>You must be an <b>Admin</b> to view and manage unassigned reports.</p>
        </div>
      </>
    );

  if (loading)
    return (
      <>
        <Navbar />
        <div className="report-page-container loading-state">Fetching unassigned reports...</div>
      </>
    );

  return (
    <>
      <Navbar />
      <div className="report-page-wrapper">
        <div className="report-page-header">
          <h1>Unassigned Reports Queue</h1>
          <p>
            Admin View: <b>{totalFilteredReports} reports</b> currently require staff assignment.
          </p>
        </div>

        <ReportsFilter filters={filters} setFilters={setFilters} departmentsList={DEPARTMENT_OPTIONS} />

        {/* --- 1. OVERDUE REPORTS SECTION --- */}
        <section className="reports-section overdue-section">
            <h2 className="reports-section-title overdue-title">
                <i className="fas fa-exclamation-triangle"></i> Priority Queue (Overdue - {overdueReports.length})
            </h2>
            <div className="report-list">
                {overdueReports.length > 0 ? (
                    overdueReports.map((report) => (
                        <UnassignedReportItem key={report._id} report={report} />
                    ))
                ) : (
                    <div className="no-reports-in-section">No overdue reports found matching filters.</div>
                )}
            </div>
        </section>

        {/* --- 2. REGULAR REPORTS SECTION --- */}
        <section className="reports-section other-section">
            <h2 className="reports-section-title other-title">
                <i className="fas fa-clock"></i> Standard Queue (Total - {otherReports.length})
            </h2>
            <div className="report-list">
                {otherReports.length > 0 ? (
                    otherReports.map((report) => (
                        <UnassignedReportItem key={report._id} report={report} />
                    ))
                ) : (
                    <div className="no-reports-in-section">No standard priority reports found matching filters.</div>
                )}
            </div>
        </section>


        {(totalFilteredReports === 0 && !error) && (
          <div className="no-reports-message">
            <i className="fas fa-clipboard-list"></i>
            <p>No unassigned reports found matching your filters. Great work!</p>
          </div>
        )}
        {error && (
            <div className="no-reports-message">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
            </div>
        )}
      </div>
    </>
  );
};

export default UnassignedReportsPage;
