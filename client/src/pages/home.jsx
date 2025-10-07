import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import ReportPopup from "../components/reportPopup";
import PastReports from "../components/pastReports";
import "./home.css";
import Modal from "react-modal";
import api from "../api/axios";

const Home = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reports, setReports] = useState([]);          // Active reports
  const [pastReports, setPastReports] = useState([]);  // Closed reports
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  // Fetch all reports of user
  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/user", { withCredentials: true });
      const allReports = res.data.data || [];

      // Separate reports
      const closed = allReports.filter((r) => r.status === "CLOSED");
      const active = allReports.filter((r) => r.status !== "CLOSED");

      // Sort both by latest update
      const sortedClosed = closed.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      const sortedActive = active.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      setReports(sortedActive);
      setPastReports(sortedClosed);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/reports/get/${id}`, {
        withCredentials: true,
      });
      setSelectedReport(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch report details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const handleReportCreated = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="home-container">
      <Navbar />

      <div className="home-content">
        <h1>Welcome to Janta Garage</h1>
        <p>Manage and report public issues efficiently.</p>

        <button className="open-report-btn" onClick={openPopup}>
          + Create Report
        </button>

        {/* Your Reports Section */}
        <div className="reports-section">
          <h2>Your Reports</h2>

          {loading ? (
            <p>Loading reports...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : reports.length === 0 ? (
            <p>No active reports found. Create one!</p>
          ) : (
            <div className="table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>User</th>
                    <th>Report Title</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report._id}
                      className="table-row"
                      onClick={() => fetchReportDetails(report._id)}
                    >
                      <td>
                        {report.image?.url ? (
                          <img
                            src={report.image.url}
                            alt={report.title}
                            className="report-img"
                          />
                        ) : (
                          <div className="no-img">No Image</div>
                        )}
                      </td>
                      <td>
                        <div className="user-info">
                          <p className="user-name">newUser</p>
                          <p className="user-email">abc@gmail.com</p>
                        </div>
                      </td>
                      <td>{report.title}</td>
                      <td>
                        {new Date(report.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            report.status?.toLowerCase() || "pending"
                          }`}
                        >
                          {report.status || "Pending"}
                        </span>
                      </td>
                      <td className="desc-col">
                        {report.description?.slice(0, 50) || "No description"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past Reports Section */}
        <section className="reports-section">
          <h2>Past Reports</h2>
          <PastReports reports={pastReports} />
        </section>
      </div>

      <ReportPopup
        isOpen={isPopupOpen}
        onRequestClose={closePopup}
        onReportCreated={handleReportCreated}
      />

      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="report-modal"
        overlayClassName="report-overlay"
      >
        {detailsLoading ? (
          <p>Loading details...</p>
        ) : selectedReport ? (
          <div className="report-popup">
            <h2>{selectedReport.title}</h2>
            <p>
              <strong>Description:</strong> {selectedReport.description}
            </p>
            <p>
              <strong>Severity:</strong> {selectedReport.severity}
            </p>
            <p>
              <strong>Status:</strong> {selectedReport.status}
            </p>
            {selectedReport.image?.url && (
              <img
                src={selectedReport.image.url}
                alt="Report"
                className="modal-img"
              />
            )}
            <p>
              <strong>Departments:</strong>{" "}
              {selectedReport.departments?.join(", ")}
            </p>
            {selectedReport.location && (
              <p>
                <strong>Location:</strong>{" "}
                {selectedReport.location.coordinates[1].toFixed(4)},{" "}
                {selectedReport.location.coordinates[0].toFixed(4)}
              </p>
            )}
            <button
              className="cancel-btn"
              onClick={() => setSelectedReport(null)}
            >
              Close
            </button>
          </div>
        ) : (
          <p>No report selected</p>
        )}
      </Modal>
    </div>
  );
};

export default Home;
