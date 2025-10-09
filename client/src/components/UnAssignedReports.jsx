import React, { useState, useEffect, useCallback } from 'react';
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

// --- Attachment Modal Component ---
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

// --- Individual Report Item ---
const UnassignedReportItem = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal

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
    imageUrl: report.image?.url, // Included image URL
  };

  const severityClass = reportDetails.severity?.toLowerCase() || 'low';
  const attachmentCount = reportDetails.imageUrl ? 1 : 0;

  const handleSummaryClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <>
    <div className="report-card unassigned-card">
      <div className="report-summary" onClick={handleSummaryClick}>
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
            <p className="detail-field half-width">
              <span className="detail-label">Current Status:</span>
              <span className="status-unassigned">UNASSIGNED</span>
            </p>

            <p className="detail-field half-width">
              <span className="detail-label">Severity:</span>
              <span className={`severity-${severityClass}`}>{reportDetails.severity}</span>
            </p>

            <p className="detail-field full-width">
              <span className="detail-label">Description:</span>{' '}
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
              <span className="detail-label">Coordinates:</span>{' '}
              {report.location?.coordinates?.join(', ') || 'N/A'}
            </p>

            <p className="detail-field half-width">
              <span className="detail-label">Map:</span>{' '}
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

          {/* Actions */}
          <div className="report-actions">
            
            {/* VIEW IMAGE BUTTON */}
            <button
                className="action-button primary-action view-image-button"
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                disabled={!attachmentCount}
            >
                <i className="fas fa-camera"></i> View Image ({attachmentCount})
            </button>
            
            {/* ASSIGN BUTTON */}
            <Link
              to={`/staffList?reportId=${reportDetails.id}`}
              className="actionButton primary-action assigButton"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fas fa-user-tag"></i> Assign to Staff
            </Link>
          </div>
        </div>
      )}
    </div>
    
    {/* Attachment Modal Render */}
    {isModalOpen && (
        <AttachmentModal 
            imageUrl={reportDetails.imageUrl} 
            onClose={() => setIsModalOpen(false)} 
        />
    )}
    </>
  );
};

// --- Main Component ---
const UnassignedReportsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthorized = user?.role === 'admin';

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedReports = await getUnassignedReports();
      const sortedReports = fetchedReports.sort((a, b) => {
        const orderA = SEVERITY_ORDER[a.severity] || 99;
        const orderB = SEVERITY_ORDER[b.severity] || 99;

        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
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
    if (isAuthorized) fetchReports();
    else setLoading(false);
  }, [user, authLoading, isAuthorized, fetchReports]);

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
            Admin View: <b>{reports.length} reports</b> currently require staff assignment. Sorted by{' '}
            <b>Severity</b>.
          </p>
        </div>

        <div className="report-list">
          {reports.map((report) => (
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
