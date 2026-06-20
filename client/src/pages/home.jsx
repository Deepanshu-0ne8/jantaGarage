import React, { useState, useMemo } from "react";
import Navbar from "../components/navbar";
import ReportPopup from "../components/reportPopup";
import PastReports from "../components/pastReports";
import Modal from "react-modal";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

Modal.setAppElement('#root'); // Ensure modal is accessible

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

const ActiveReportCard = ({ report, onClick }) => {
  const statusColors = {
    'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  
  const severityColors = {
    'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  const statusClass = statusColors[(report.status || "Pending").toLowerCase().replace(/_/g, "-")] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  const severityClass = severityColors[(report.severity || "Low").toLowerCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  
  const reportDate = report.createdAt ? formatDate(report.createdAt) : "-";
  const deadlineText = report.deadline ? formatDate(report.deadline) : "No Deadline";
  const isOverdue = !!report.isOverdue;

  return (
    <div
      className={`glass-card group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] ${isOverdue ? 'ring-1 ring-rose-500/50' : ''}`}
      onClick={() => onClick(report._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(report._id);
      }}
    >
      <div className="h-48 overflow-hidden relative">
        {report.image?.url ? (
          <img src={report.image.url} alt={report.title || "report"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-slate-800/80 flex items-center justify-center text-slate-500 font-medium border-b border-slate-700/50">
            <i className="fas fa-image text-3xl mb-2 opacity-50 block"></i>
            <span>No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        {isOverdue && (
          <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.5)]">
            Overdue
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{report.title || "Untitled Report"}</h3>
        
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <i className="far fa-calendar-alt w-4"></i> Filed: {reportDate}
          </p>
          <p className={`text-xs flex items-center gap-2 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
            <i className="far fa-clock w-4"></i> Deadline: {deadlineText}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
            {labelize(report.status) || "Pending"}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${severityClass}`}>
            {labelize(report.severity) || "Low"}
          </span>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const { data: allReports = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["reports", "user"],
    queryFn: async () => {
      const res = await api.get("/reports/user", { withCredentials: true });
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const { data: unassignedCount = 0 } = useQuery({
    queryKey: ["reports", "unassignedCount"],
    queryFn: async () => {
      const res = await api.get("/reports/unAssigned", { withCredentials: true });
      return res.data?.data?.length || 0;
    },
    enabled: !!user && user.role === "admin",
  });

  const error = queryError ? (queryError.response?.data?.message || "Failed to fetch reports") : "";

  const sortedActiveReports = useMemo(() => {
    return allReports
      .filter((r) => r.status !== "Resolved")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [allReports]);

  const pastReports = useMemo(() => {
    return allReports
      .filter((r) => r.status === "Resolved")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [allReports]);

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

  const handleReportCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["reports", "user"] });
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{user?.name || user?.userName || "Citizen"}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">Track your reported issues and create new complaints easily.</p>
          </div>
          <Link to="/heatMap" className="inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-blue-500/20 w-full md:w-auto">
            <i className="fas fa-map-marked-alt text-blue-400"></i> View Heat Map
          </Link>
        </div>

        {/* Action Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
          
          <button onClick={openPopup} className="glass-card p-6 text-left hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform">
              <i className="fas fa-bullhorn text-blue-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Create New Report</h3>
            <p className="text-xs text-slate-400">File a complaint about a public issue in your area.</p>
          </button>

          {isStaff && (
            <Link to="/assignedReports" className="glass-card p-6 text-left hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <i className="fas fa-clipboard-check text-emerald-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Assigned Reports</h3>
              <p className="text-xs text-slate-400">Manage issues assigned to your department(s).</p>
            </Link>
          )}

          {isAdmin && (
            <Link to="/unAssignedReports" className="glass-card p-6 text-left hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 border border-amber-500/30 group-hover:scale-110 transition-transform relative">
                <i className="fas fa-clipboard-list text-amber-400 text-xl"></i>
                {unassignedCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                    {unassignedCount}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Unassigned Reports</h3>
              <p className="text-xs text-slate-400">{unassignedCount} reports awaiting assignment.</p>
            </Link>
          )}

          {isAdmin && (
            <Link to="/assignedByAdmin" className="glass-card p-6 text-left hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-tie text-purple-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Assigned By You</h3>
              <p className="text-xs text-slate-400">Track all reports assigned by you.</p>
            </Link>
          )}
        </div>

        {/* Active Reports Section */}
        <section className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-white">Your Active Reports</h2>
            <div className="h-px bg-slate-800 flex-grow"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg text-center">
              {error}
            </div>
          ) : sortedActiveReports.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <i className="fas fa-folder-open text-2xl text-slate-500"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-1">No Active Reports</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">You don't have any pending or in-progress reports. Create one to see it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedActiveReports.map((report) => (
                <ActiveReportCard key={report._id} report={report} onClick={fetchReportDetails} />
              ))}
            </div>
          )}
        </section>

        {/* Past Reports Section */}
        <section className="animate-in fade-in slide-in-from-bottom-10 duration-500 delay-300">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-white">Your Past Reports</h2>
            <div className="h-px bg-slate-800 flex-grow"></div>
          </div>
          <PastReports reports={pastReports} fetchDetails={fetchReportDetails} />
        </section>
      </main>

      <ReportPopup isOpen={isPopupOpen} onRequestClose={closePopup} onReportCreated={handleReportCreated} />

      {/* Modern Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
      >
        <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl shadow-blue-900/20 border-slate-700/60">
          {detailsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedReport ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1 pr-8">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-400">
                    Filed on {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
                <button 
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors absolute top-6 right-6"
                  onClick={() => setSelectedReport(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                
                {/* Image Section */}
                {selectedReport.image?.url && (
                  <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
                    <img src={selectedReport.image.url} alt="Report" className="w-full h-auto max-h-[300px] object-contain" />
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                  
                  {/* Status & Severity */}
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Status</p>
                    <p className="font-medium text-white">{labelize(selectedReport.status)}</p>
                  </div>
                  
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Severity</p>
                    <p className="font-medium text-white">{labelize(selectedReport.severity) || 'Not Set'}</p>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Deadline</p>
                    <p className="font-medium text-white">{selectedReport.deadline ? formatDate(selectedReport.deadline) : "No Deadline"}</p>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Assigned To</p>
                    <p className="font-medium text-white">{selectedReport.assignedTo?.name || selectedReport.assignedTo?.userName || 'N/A'}</p>
                  </div>
                </div>

                {/* Full Width Details */}
                <div className="space-y-4">
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Description</p>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Departments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.departments?.map(dept => (
                        <span key={dept} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-xs font-medium">
                          {dept}
                        </span>
                      )) || <span className="text-slate-500 text-sm">None</span>}
                    </div>
                  </div>

                  {selectedReport.location && (
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Location Coordinates</p>
                            <p className="font-mono text-sm text-emerald-400">
                              {selectedReport.location.coordinates[1].toFixed(4)}, {selectedReport.location.coordinates[0].toFixed(4)}
                            </p>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${selectedReport.location.coordinates[1]},${selectedReport.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2"
                          >
                            <i className="fas fa-map-marker-alt text-emerald-400"></i> Open in Maps
                          </a>
                       </div>
                    </div>
                  )}
                </div>
              </div>

            </>
          ) : (
             <div className="p-8 text-center text-slate-400">Report details not found.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Home;
