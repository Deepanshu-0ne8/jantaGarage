import React, { useState } from "react";
import Modal from "react-modal";
import "./pastReports.css";

Modal.setAppElement("#root");

const PastReports = ({ reports = [] }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  if (!reports.length) {
    return <p className="no-past-reports">No past reports found.</p>;
  }

  return (
    <div className="past-reports-container">
      {reports.map((report) => (
        <div
          key={report._id}
          className="report-card"
          onClick={() => setSelectedReport(report)}
        >
          <div className="report-img-wrapper">
            {report.image?.url ? (
              <img
                src={report.image.url}
                alt={report.title}
                className="report-img"
              />
            ) : (
              <div className="no-img">No Image</div>
            )}
          </div>

          <div className="report-info">
            <h3>{report.title}</h3>
            <p className="report-date"> Resolved On :
              { new Date(report.createdAt).toLocaleDateString("en-GB")}
            </p>
            <p className="report-status">
              <span
                className={`status-badge ${
                  report.status?.toLowerCase() || "pending"
                }`}
              >
                {report.status}
              </span>
            </p>
            <p className="report-desc">
              {report.description?.slice(0, 60) || "No description available"}
            </p>
          </div>
        </div>
      ))}

      {/* Modal for full details */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="report-modal"
        overlayClassName="report-overlay"
      >
        {selectedReport && (
          <div className="report-popup">
            <h2>{selectedReport.title}</h2>

            {selectedReport.image?.url && (
              <img
                src={selectedReport.image.url}
                alt="Report"
                className="modal-img"
              />
            )}

            <p>
              <strong>Description:</strong> {selectedReport.description}
            </p>
            <p>
              <strong>Severity:</strong> {selectedReport.severity}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`status-badge ${
                  selectedReport.status?.toLowerCase() || "pending"
                }`}
              >
                {selectedReport.status}
              </span>
            </p>
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
            <p>
              <strong>Resolved On:</strong>{" "}
              {new Date(selectedReport.updatedAt).toLocaleDateString("en-GB")}
            </p>

            <button
              className="close-btn"
              onClick={() => setSelectedReport(null)}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PastReports;
