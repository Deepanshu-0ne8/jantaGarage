import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import ReportPopup from "../components/reportPopup";
import PastReports from "../components/pastReports";
import "./home.css";
import Modal from "react-modal";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

const labelize = (raw) => {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const ActiveReportCard = ({ report, onClick }) => {
  const statusClass = (report.status || "Pending").toLowerCase().replace(/_/g, "-");
  const severityClass = (report.severity || "Low").toLowerCase();
  const reportDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-GB")
    : "-";

  return (
    <div
      className="report-card-item"
      onClick={() => onClick(report._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(report._id);
      }}
    >
      <div className="card-image-wrapper">
        {report.image?.url ? (
          <img src={report.image.url} alt={report.title || "report image"} className="report-img" />
        ) : (
          <div className="no-img">No Image</div>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{report.title || "Untitled Report"}</h3>
        <p className="card-date">Filed: {reportDate}</p>
        <div className="card-footer">
          <span className={`status-badge status-${statusClass}`}>
            {labelize(report.status) || "Pending"}
          </span>

          <span className={`severity severity-${severityClass}`}>
            {labelize(report.severity) || "Low"}
          </span>
        </div>
      </div>
    </div>
  );
};

const fetchUnassignedCount = async () => {
    try {
        const res = await api.get("/reports/unAssigned", { withCredentials: true });
        return res.data.data.length || 0; 
    } catch (err) {
        return 0; 
    }
};

const Home = () => {
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [pastReports, setPastReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [globalUnassignedCount, setGlobalUnassignedCount] = useState(0); // NEW STATE FOR ADMIN COUNT

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const fetchUserReports = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/reports/user", { withCredentials: true });
      const allReports = res.data?.data || [];

      const closed = allReports.filter((r) => r.status === "Resolved");
      const active = allReports.filter((r) => r.status !== "Resolved");

      const sortedClosed = closed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const sortedActive = active.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setReports(sortedActive);
      setPastReports(sortedClosed);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/reports/get/${id}`, { withCredentials: true });
      setSelectedReport(res.data?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserReports();
      if (user.role === 'admin') {
          fetchUnassignedCount().then(setGlobalUnassignedCount);
      }
    }
  }, [user]);

  const handleReportCreated = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="home-container">
      <Navbar />

      <div className="home-content">
        <h1 className="welcome-title">Welcome, {user?.name || user?.userName || "Citizen"}</h1>
        <p className="welcome-tagline">Track your reported issues and create new complaints easily.</p>

        {/* --- ACTION BLOCK --- */}
        <div className="action-block-wrapper">
          <button className="open-report-btn action-card primary-action" onClick={openPopup}>
            <i className="fas fa-bullhorn" aria-hidden="true"></i>
            <span className="action-title">Create New Report</span>
            <span className="action-desc">File a complaint about a public issue in your area.</span>
          </button>

          {isAdmin && (
            <Link to="/unAssignedReports" className="admin-action-btn action-card secondary-action">
              <i className="fas fa-clipboard-list" aria-hidden="true"></i>
              <span className="action-title">Review Unassigned Reports</span>
              <span className="action-desc">{globalUnassignedCount} reports awaiting assignment.</span> {/* FIX: Use globalUnassignedCount */}
            </Link>
          )}
        </div>

        {/* --- ACTIVE REPORTS --- */}
        <section className="reports-section">
          <h2>Your Active Reports</h2>

          {loading ? (
            <p className="status-text">Loading reports...</p>
          ) : error ? (
            <p className="status-text error-text">{error}</p>
          ) : reports.length === 0 ? (
            <p className="status-text no-reports">No active reports found. Create one to see it here!</p>
          ) : (
            <div className="reports-grid">
              {reports.map((report) => (
                <ActiveReportCard key={report._id} report={report} onClick={fetchReportDetails} />
              ))}
            </div>
          )}
        </section>

        {/* --- PAST REPORTS --- */}
        <section className="reports-section past-reports-section">
          <h2>Your Past Reports</h2>
          <PastReports reports={pastReports} fetchDetails={fetchReportDetails} />
        </section>
      </div>

      {/* --- POPUPS & MODALS --- */}
      <ReportPopup isOpen={isPopupOpen} onRequestClose={closePopup} onReportCreated={handleReportCreated} />

      <Modal isOpen={!!selectedReport} onRequestClose={() => setSelectedReport(null)} className="report-modal" overlayClassName="report-overlay">
        {detailsLoading ? (
          <p className="status-text">Loading details...</p>
        ) : selectedReport ? (
          <div className="report-popup">
            <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>&times;</button>
            <h2 className="modal-title">{selectedReport.title}</h2>
            
            {/* CALCULATE MAP LINK HERE */}
            {(() => {
                const coords = selectedReport.location?.coordinates;
                const locationLink = coords 
                    ? `https://maps.google.com/?q=${coords[1]},${coords[0]}` 
                    : null;
                
                return (
                    <div className="modal-content-grid">
                        <p className="modal-detail">
                            <strong>Status:</strong>{" "}
                            <span className={`status-badge status-${(selectedReport.status || "").toLowerCase().replace(/_/g, "-")}`}>
                                {labelize(selectedReport.status)}
                            </span>
                        </p>

                        <p className="modal-detail">
                            <strong>Severity:</strong>{" "}
                            <span className={`severity severity-${(selectedReport.severity || "").toLowerCase()}`}>
                                {labelize(selectedReport.severity)}
                            </span>
                        </p>

                        <p className="modal-detail full-row">
                            <strong>Filed:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
                        </p>

                        <p className="modal-detail full-row description">
                            <strong>Description:</strong> {selectedReport.description}
                        </p>

                        <p className="modal-detail full-row">
                            <strong>Departments:</strong> {selectedReport.departments?.join(", ")}
                        </p>

                        {/* DISPLAY LOCATION AND MAP LINK */}
                        {selectedReport.location && (
                            <>
                                <p className="modal-detail full-row">
                                    <strong>Coordinates:</strong>{" "}
                                    {selectedReport.location.coordinates[1].toFixed(4)}, {selectedReport.location.coordinates[0].toFixed(4)}
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
                );
            })()}

            {selectedReport.image?.url && <img src={selectedReport.image.url} alt="Report" className="modal-img" />}

            <button className="cancel-btn" onClick={() => setSelectedReport(null)}>Close Details</button>
          </div>
        ) : (
          <p className="status-text">No report selected</p>
        )}
      </Modal>
    </div>
  );
};

export default Home;
