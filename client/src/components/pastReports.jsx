// client/src/components/pastReports.jsx

import React, { useState } from "react";
import Modal from "react-modal";
import "./pastReports.css"; // optional extra styling if needed

const PastReports = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="table-container">
      {reports.length === 0 ? (
        <p>No past reports found.</p>
      ) : (
        <table className="reports-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
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
                onClick={() => setSelectedReport(report)}
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
                <td>{report.title}</td>
                <td>{new Date(report.createdAt).toLocaleDateString("en-GB")}</td>
                <td>
                  <span
                    className={`status-badge ${
                      report.status?.toLowerCase() || "pending"
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="desc-col">
                  {report.description?.slice(0, 50) || "No description"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Popup for Past Report Details */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="report-modal"
        overlayClassName="report-overlay"
      >
        {selectedReport ? (
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

export default PastReports;
