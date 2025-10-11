import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import './ReportDetails.css';
import { getReportById } from '../services/reportService';

// --- Utility Functions ---
const labelize = (raw) => {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString('en-GB');
};

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Report Details ---
  const fetchReport = useCallback(async (reportId) => {
    if (!reportId) {
      setError("No Report ID provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedReport = await getReportById(reportId);
      setReport(fetchedReport);
    } catch (err) {
      setError(err.message || "Could not load report details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(id);
  }, [id, fetchReport]);

  // --- Render Guards ---
  if (loading)
    return (
      <>
        <Navbar />
        <div className="detail-page-container status-message">Loading report details...</div>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className="detail-page-container status-message error">Error: {error}</div>
      </>
    );

  if (!report)
    return (
      <>
        <Navbar />
        <div className="detail-page-container status-message">Report not found.</div>
      </>
    );

  // --- Data Preparation ---
  const severityClass = (report.severity || 'low').toLowerCase();
  const statusClass = (report.status || 'open').toLowerCase().replace(/_/g, '-');
  const coords = report.location?.coordinates;
  const locationLink = coords
    ? `https://maps.google.com/?q=${coords[1]},${coords[0]}`
    : null;

  return (
    <>
      <Navbar />
      <div className="detail-page-container">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1 className="report-title">{report.title || "Untitled Report"}</h1>

          <div className="detail-meta-bar">
            <span className="meta-item"><strong>ID:</strong> #{report._id.substring(0, 8)}</span>
            <span className="meta-item"><strong>Status:</strong>
              <span className={`status-badge status-${statusClass}`}>{labelize(report.status)}</span>
            </span>
            <span className="meta-item"><strong>Severity:</strong>
              <span className={`status-badge status-${severityClass}`}>{labelize(report.severity)}</span>
            </span>
            <span className="meta-item"><strong>Reported By:</strong> {report.createdBy?.name || report.createdBy?.userName || 'Citizen'}</span>
            <span className="meta-item"><strong>Date Filed:</strong> {formatDate(report.createdAt)}</span>
          </div>
        </div>

        <div className="detail-content-grid">
          {/* Left Side */}
          <div className="left-column">
            <div className="detail-card">
              <h2>Assignment Details</h2>
              <p><strong>Assigned Staff:</strong> {report.assignedTo?.name || report.assignedTo?.userName || 'N/A'}</p>
              <p><strong>Departments:</strong> {report.departments?.join(", ") || 'None'}</p>
              <p><strong>Deadline:</strong> {formatDate(report.deadline)}</p>
              <p><strong>Last Updated:</strong> {formatDate(report.updatedAt)}</p>
            </div>

            <div className="detail-card">
              <h2>Description</h2>
              <p>{report.description || "No description provided for this issue."}</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="right-column">
            <div className="detail-card">
              <h2>Attachment</h2>
              {report.image?.url ? (
                <img
                  src={report.image.url}
                  alt="Report"
                  className="report-image"
                  onError={(e) => { e.target.src = "https://placehold.co/300x200/cccccc/333333?text=Image+Unavailable"; }}
                />
              ) : (
                <div className="no-image">No image attached</div>
              )}
            </div>

            <div className="detail-card">
              <h2>Location</h2>
              <p><strong>Coordinates:</strong> {coords ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : "N/A"}</p>
              {locationLink && (
                <a href={locationLink} target="_blank" rel="noopener noreferrer" className="map-link">
                  View on Google Maps <i className="fas fa-map-marker-alt"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportDetails;
