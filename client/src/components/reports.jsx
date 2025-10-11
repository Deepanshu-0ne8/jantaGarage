import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { CSVLink } from "react-csv";
import "./reports.css";
import api from "../api/axios";
import Navbar from "../components/navbar";

Modal.setAppElement("#root");

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
  });
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/reports"); // your backend endpoint
      setReports(res.data.data);

      const totalReports = res.data.data.length;
      const resolvedReports = res.data.data.filter(r => r.status === "Resolved").length;
      const inProgressReports = res.data.data.filter(r => r.status === "IN_PROGRESS").length;
      const pendingReports = totalReports - resolvedReports - inProgressReports;

      setStats({
        total: totalReports,
        resolved: resolvedReports,
        pending: pendingReports,
        inProgress: inProgressReports,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const pieData = [
    { name: "Resolved", value: stats.resolved },
    { name: "In Progress", value: stats.inProgress },
    { name: "Pending", value: stats.pending },
  ];
  const COLORS = ["#28a745", "#ffc107", "#dc3545"];

  const csvHeaders = [
    { label: "Title", key: "title" },
    { label: "Description", key: "description" },
    { label: "Status", key: "status" },
    { label: "Created At", key: "createdAt" },
    { label: "Updated At", key: "updatedAt" },
  ];
  // Calculate average resolution time in milliseconds
const resolvedReports = reports.filter(r => r.status === "Resolved");
const avgMs = resolvedReports.length > 0
  ? resolvedReports.reduce((acc, r) => acc + (new Date(r.updatedAt) - new Date(r.createdAt)), 0) 
    / resolvedReports.length
  : 0;

// Convert ms to days and hours
const avgDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
const avgHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

const avgResolutionTime = `${avgDays}d ${avgHours}h`;



  return (
    <>
    <Navbar />
    <div className="reports-page">
      <h1>Reports Dashboard</h1>

      {/* Live Stats */}
      <div className="reports-stats">
        <div className="stat-box"><h3>Total Reports</h3><p>{stats.total}</p></div>
        <div className="stat-box"><h3>Resolved</h3><p>{stats.resolved}</p></div>
        <div className="stat-box"><h3>In Progress</h3><p>{stats.inProgress}</p></div>
        <div className="stat-box"><h3>Pending</h3><p>{stats.pending}</p></div>
      </div>

      {/* Pie Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="avg-resolution-time">
        <h3>Average Resolution Time: {avgResolutionTime}</h3>
      </div>
      {/* Download CSV */}
      <div className="download-btn">
        <CSVLink data={reports} headers={csvHeaders} filename="reports.csv" className="csv-link">
          Download CSV
        </CSVLink>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {reports.map(report => (
          <div key={report._id} className={`report-card`} onClick={() => setSelectedReport(report)}>
            <h3 className="card-title">{report.title}</h3>
            {/* <p className="card-description">{report.description}</p> */}
            <span className={`status-badge status-${report.status.toLowerCase().replace(/_/g,"-")}`}>{report.status}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="reports-page report-modal"
        overlayClassName="reports-page report-overlay"
      >
        {selectedReport && (
          <div className="report-popup">
            <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>&times;</button>
            <h2 className="modal-title">{selectedReport.title}</h2>
            <div className="modal-content-grid">
              <p><strong>Status:</strong> <span className={`status-badge status-${selectedReport.status.toLowerCase().replace(/_/g,"-")}`}>{selectedReport.status}</span></p>
              <p><strong>Description:</strong> {selectedReport.description}</p>
              <p><strong>Created At:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(selectedReport.updatedAt).toLocaleString()}</p>
              <p><strong>Departments:</strong> {selectedReport.departments?.join(", ") || "N/A"}</p>
              <p><strong>Assigned To:</strong> {selectedReport.assignedTo?.name || selectedReport.assignedTo?.userName || "N/A"}</p>
              {selectedReport.image?.url && <img className="modal-img" src={selectedReport.image.url} alt="Report" />}
            </div>
            <button className="cancel-btn" onClick={() => setSelectedReport(null)}>Close</button>
          </div>
        )}
      </Modal>
    </div>
    </>
  );
};

export default Reports;
