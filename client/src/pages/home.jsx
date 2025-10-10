import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/navbar";
import ReportPopup from "../components/reportPopup";
import PastReports from "../components/pastReports";
import "./home.css";
import Modal from "react-modal";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

Modal.setAppElement('#root'); // Ensure modal is accessible

// Severity priority map (used for internal sorting consistency if needed)
const SEVERITY_ORDER = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
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

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Helper to determine deadline chip class, comparing the full timestamp (date + time)
const getDeadlineClass = (deadlineDate, status) => {
    // Only check active reports for urgency
    if (status === 'Resolved' || status === 'CLOSED' || !deadlineDate) {
        return ''; 
    }

    const nowTime = new Date().getTime();
    const deadlineTime = new Date(deadlineDate).getTime();
    
    // Check for Overdue status using full timestamp
    if (nowTime > deadlineTime) return 'deadline-overdue';

    const msInDay = 1000 * 60 * 60 * 24;
    const diffDays = (deadlineTime - nowTime) / msInDay;

    if (diffDays <= 1) return 'deadline-critical'; // Less than or equal to 1 day remaining
    if (diffDays <= 3) return 'deadline-urgent';   // Less than or equal to 3 days remaining
    return 'deadline-normal';
};


const ActiveReportCard = ({ report, onClick }) => {
  const statusClass = (report.status || "Pending").toLowerCase().replace(/_/g, "-");
  const severityClass = (report.severity || "Low").toLowerCase();
  const reportDate = report.createdAt ? formatDate(report.createdAt) : "-";
  
  // NEW: Deadline calculation for visual flags
  const deadlineClass = getDeadlineClass(report.deadline, report.status);
  const deadlineText = report.deadline ? formatDate(report.deadline) : "No Deadline";
  const isOverdue = deadlineClass === 'deadline-overdue';

  return (
    <div
      className={`report-card-item ${deadlineClass} ${isOverdue ? 'is-overdue' : ''}`}
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
        <p className="card-deadline">
          Deadline:{" "}
          <span className={`deadline-date ${deadlineClass || 'no-deadline'}`}>
            {deadlineText}
          </span>
        </p>
        <div className="card-footer">
          <span className={`status-badge status-${statusClass}`}>
            {labelize(report.status) || "Pending"}
          </span>
          
          {isOverdue && (
            <span className="deadline-tag overdue-tag-card">OVERDUE</span>
          )}

          <span className={`card-severity severity-${severityClass}`}>
            {labelize(report.severity) || "Low"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Utility: fetch count of unassigned reports
const fetchUnassignedCount = async () => {
  try {
    // Using api mock placeholder
    const res = await api.get("/reports/unAssigned", { withCredentials: true });
    return res.data?.data?.length || 0; 
  } catch {
    return 0;
  }
};

const Home = () => {
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reports, setReports] = useState([]); // All active reports fetched from API
  const [pastReports, setPastReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [globalUnassignedCount, setGlobalUnassignedCount] = useState(0);
  
  // NEW: State for forcing real-time update
  const [realTimeKey, setRealTimeKey] = useState(0);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const fetchUserReports = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Using api mock placeholder
      const res = await api.get("/reports/user", { withCredentials: true });
      const allReports = res.data?.data || [];

      const closed = allReports.filter((r) => r.status === "Resolved");
      const active = allReports.filter((r) => r.status !== "Resolved");

      const sortedClosed = closed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      // NOTE: We no longer sort here. Sorting logic is moved to useMemo for real-time key dependency.
      setReports(active); 
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
      // Using api mock placeholder
      const res = await api.get(`/reports/get/${id}`, { withCredentials: true });
      setSelectedReport(res.data?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // --- REAL-TIME DEADLINE CHECKER ---
  useEffect(() => {
      let timer;
      const nowTime = new Date().getTime();
      
      // 1. Find the next relevant deadline time among ACTIVE reports
      const nextDeadlineTime = reports.reduce((minTime, report) => {
          if (report.status !== 'OPEN' && report.status !== 'IN_PROGRESS' || !report.deadline) return minTime;

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


  useEffect(() => {
    if (user) {
      fetchUserReports();
      if (user.role === "admin") {
        fetchUnassignedCount().then(setGlobalUnassignedCount);
      }
    }
  }, [user]);

  const handleReportCreated = (newReport) => {
    // Add the new report to the active list and re-sort (re-sorting is done in useMemo)
    if (newReport) {
      setReports((prev) => [newReport, ...prev]);
    }
  };
  
  // NEW: Sort active reports based on updated date/realTimeKey
  const sortedActiveReports = useMemo(() => {
      return reports.sort((a, b) => {
          // Primary Sort: UpdatedAt/CreatedAt (Newest first)
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [reports, realTimeKey]); // Dependency on realTimeKey ensures refresh on deadline

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const unassignedCount = globalUnassignedCount;

  return (
    <div className="home-container">
      <Navbar />

      <div className="home-content">
        <div className="header-map-wrapper">
          <h1 className="welcome-title">Welcome, {user?.name || user?.userName || "Citizen"}</h1>
          <Link to="/heatMap" className="map-link-btn">
            <i className="fas fa-map-marked-alt"></i> View Heat Map
          </Link>
        </div>

        <p className="welcome-tagline">Track your reported issues and create new complaints easily.</p>

        <div className="action-block-wrapper">
          <button className="open-report-btn action-card primary-action" onClick={openPopup}>
            <i className="fas fa-bullhorn" aria-hidden="true"></i>
            <span className="action-title">Create New Report</span>
            <span className="action-desc">File a complaint about a public issue in your area.</span>
          </button>

          {isStaff && (
            <Link to="/assignedReports" className="staff-action-btn action-card secondary-action">
              <i className="fas fa-clipboard-check" aria-hidden="true"></i>
              <span className="action-title">Review Assigned Reports</span>
              <span className="action-desc">Manage issues assigned to your department(s).</span>
            </Link>
          )}

          {isAdmin && (
            <Link to="/unAssignedReports" className="admin-action-btn action-card secondary-action">
              <i className="fas fa-clipboard-list" aria-hidden="true"></i>
              <span className="action-title">Assign Unassigned Reports</span>
              <span className="action-desc">{unassignedCount} reports awaiting assignment.</span>
            </Link>
          )}

          {/* NEW ADMIN ACTION BLOCK */}
          {isAdmin && (
            <Link to="/assignedByAdmin" className="admin-assigned-by-btn action-card tertiary-action">
              <i className="fas fa-user-tie" aria-hidden="true"></i>
              <span className="action-title">Reports Assigned By You</span>
              <span className="action-desc">Track all reports assigned by you.</span>
            </Link>
          )}
        </div>

        <section className="reports-section">
          <h2>Your Active Reports</h2>

          {loading ? (
            <p className="status-text">Loading reports...</p>
          ) : error ? (
            <p className="status-text error-text">{error}</p>
          ) : sortedActiveReports.length === 0 ? (
            <p className="status-text no-reports">No active reports found. Create one to see it here!</p>
          ) : (
            <div className="reports-grid">
              {sortedActiveReports.map((report) => (
                <ActiveReportCard key={report._id} report={report} onClick={fetchReportDetails} />
              ))}
            </div>
          )}
        </section>

        <section className="reports-section past-reports-section">
          <h2>Your Past Reports</h2>
          <PastReports reports={pastReports} fetchDetails={fetchReportDetails} />
        </section>
      </div>

      <ReportPopup isOpen={isPopupOpen} onRequestClose={closePopup} onReportCreated={handleReportCreated} />

      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="report-modal"
        overlayClassName="report-overlay"
      >
        {detailsLoading ? (
          <p className="status-text">Loading details...</p>
        ) : selectedReport ? (
          <div className="report-popup">
            <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>
              &times;
            </button>
            <h2 className="modal-title">{selectedReport.title}</h2>

            {(() => {
              const coords = selectedReport.location?.coordinates;
              const locationLink = coords
                ? `https://maps.google.com/?q=${coords[1]},${coords[0]}`
                : null;

              return (
                <div className="modal-content-grid">
                  <p className="modal-detail">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`status-badge status-${(selectedReport.status || "")
                        .toLowerCase()
                        .replace(/_/g, "-")}`}
                    >
                      {labelize(selectedReport.status)}
                    </span>
                  </p>

                  <p className="modal-detail">
                    <strong>Severity:</strong>{" "}
                    <span
                      className={`card-severity severity-${(
                        selectedReport.severity || "low"
                      ).toLowerCase()}`}
                    >
                      {labelize(selectedReport.severity)}
                    </span>
                  </p>

                  <p className="modal-detail">
                    <strong>Deadline:</strong>{" "}
                    {selectedReport.deadline
                      ? formatDate(selectedReport.deadline)
                      : "No Deadline Set"}
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
                  
                  <p className="modal-detail full-row">
                    <strong>Assigned To:</strong> {selectedReport.assignedTo?.name || selectedReport.assignedTo?.userName || 'N/A'}
                  </p>

                  {selectedReport.location && (
                    <>
                      <p className="modal-detail full-row">
                        <strong>Coordinates:</strong>{" "}
                        {selectedReport.location.coordinates[1].toFixed(4)},{" "}
                        {selectedReport.location.coordinates[0].toFixed(4)}
                      </p>
                      {locationLink && (
                        <p className="modal-detail full-row">
                          <strong>Map:</strong>{" "}
                          <a
                            href={locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-link"
                          >
                            View Location <i className="fas fa-map-marker-alt"></i>
                          </a>
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {selectedReport.image?.url && (
              <img src={selectedReport.image.url} alt="Report" className="modal-img" />
            )}

            <button className="cancel-btn" onClick={() => setSelectedReport(null)}>
              Close Details
            </button>
          </div>
        ) : (
          <p className="status-text">No report selected</p>
        )}
      </Modal>
    </div>
  );
};

export default Home;
