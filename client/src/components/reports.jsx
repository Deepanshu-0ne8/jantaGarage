import React, { useState } from "react";
import Modal from "react-modal";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/axios";
import Navbar from "../components/navbar";
import { useQuery } from "@tanstack/react-query";

Modal.setAppElement("#root");

const DEPARTMENTS = [
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

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  
  const limit = 20;

  const { data: statsData = {} } = useQuery({
    queryKey: ["reports", "stats"],
    queryFn: async () => {
      const res = await api.get("/reports/stats");
      return res.data;
    },
  });

  const { data = {}, isLoading } = useQuery({
    queryKey: ["reports", "all", page, severityFilter, statusFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit });
      if (severityFilter) params.append("severity", severityFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (departmentFilter) params.append("departments", departmentFilter);
      
      const res = await api.get(`/reports?${params.toString()}`);
      return res.data;
    },
  });

  const reports = data.data || [];
  const stats = statsData.stats || { total: 0, resolved: 0, pending: 0, inProgress: 0 };
  const pagination = data.pagination || { totalPages: 1, page: 1, total: 0 };
  const avgResolutionTimeMs = statsData.avgResolutionTimeMs || 0;


  const pieData = [
    { name: "Resolved", value: stats.resolved },
    { name: "In Progress", value: stats.inProgress },
    { name: "Pending", value: stats.pending },
  ];
  const COLORS = ["#10b981", "#f59e0b", "#f43f5e"]; // Tailwind Emerald, Amber, Rose

  const handleDownloadCSV = async () => {
    try {
      const response = await api.get("/reports/download-csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reports_data.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to download CSV", error);
    }
  };

  // Convert ms to days and hours
  const avgDays = Math.floor(avgResolutionTimeMs / (1000 * 60 * 60 * 24));
  const avgHours = Math.floor((avgResolutionTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const avgResolutionTime = `${avgDays}d ${avgHours}h`;

  const statusColors = {
    'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Reports Dashboard</h1>
            <p className="text-slate-400 text-lg max-w-2xl">Overview and analytics of all reported issues across the platform.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={handleDownloadCSV} className="inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-blue-500/20 w-full md:w-auto">
              <i className="fas fa-download text-blue-400"></i> Export CSV
            </button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform group">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-blue-400 transition-colors">Total Reports</h3>
             <p className="text-4xl font-extrabold text-white">{stats.total}</p>
          </div>
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform group border-emerald-500/20">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-400 transition-colors">Resolved</h3>
             <p className="text-4xl font-extrabold text-emerald-400">{stats.resolved}</p>
          </div>
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform group border-amber-500/20">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-amber-400 transition-colors">In Progress</h3>
             <p className="text-4xl font-extrabold text-amber-400">{stats.inProgress}</p>
          </div>
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-transform group border-rose-500/20">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-rose-400 transition-colors">Pending</h3>
             <p className="text-4xl font-extrabold text-rose-400">{stats.pending}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          
          <div className="lg:col-span-2 glass-card p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
             <h2 className="text-xl font-bold text-white mb-6 self-start flex items-center gap-2">
                <i className="fas fa-chart-pie text-blue-400"></i> Status Distribution
             </h2>
             <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '0.5rem', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
             </div>
          </div>
          
          <div className="glass-card p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/3"></div>
             <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                <i className="fas fa-stopwatch text-3xl text-emerald-400"></i>
             </div>
             <h3 className="text-lg font-bold text-slate-300 mb-2">Average Resolution Time</h3>
             <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-4">{avgResolutionTime}</p>
             <p className="text-xs text-slate-500">Based on {stats.resolved} resolved issues.</p>
          </div>
        </div>

        {/* Reports List */}
        <section className="animate-in fade-in slide-in-from-bottom-10 duration-500 delay-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-white whitespace-nowrap">Recent Reports</h2>
            <div className="flex flex-wrap items-center gap-3">
              {(severityFilter || statusFilter || departmentFilter) && (
                <button 
                  onClick={() => {
                    setSeverityFilter("");
                    setStatusFilter("");
                    setDepartmentFilter("");
                    setPage(1);
                  }}
                  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <i className="fas fa-times"></i> Clear
                </button>
              )}
              <select 
                value={severityFilter} 
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                className="bg-slate-800/80 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                <option value="">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-800/80 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open (Pending)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select 
                value={departmentFilter} 
                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                className="bg-slate-800/80 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 max-w-[180px] md:max-w-[200px]"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-px bg-slate-800 flex-grow mb-6"></div>
          
          {isLoading ? (
             <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
             </div>
          ) : reports.length === 0 ? (
             <div className="glass-card p-12 text-center text-slate-400">
                No reports found in the system.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reports.map(report => {
                const sClass = statusColors[(report.status || "Pending").toLowerCase().replace(/_/g, "-")] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
                const isOverdue = !!report.isOverdue;
                return (
                  <div 
                    key={report._id} 
                    className={`glass-card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${
                      isOverdue ? 'ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : ''
                    }`} 
                    onClick={() => setSelectedReport(report)}
                  >
                    {isOverdue && (
                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
                        <div className="absolute top-2 -right-6 bg-rose-500 text-white text-[9px] font-bold py-1 px-8 transform rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                          OVERDUE
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-white mb-3 pr-8 line-clamp-1 group-hover:text-blue-400 transition-colors">{report.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400"><i className="far fa-clock"></i> {new Date(report.createdAt).toLocaleDateString()}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${sClass}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-start">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                        report.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        report.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}>
                        {report.severity || "N/A"} Severity
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination UI */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-400 text-sm font-medium bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                Page <span className="text-white">{page}</span> of <span className="text-white">{pagination.totalPages}</span>
              </span>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
      >
        {selectedReport && (
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 pr-8">{selectedReport.title}</h2>
                <p className="text-xs text-slate-400">
                  ID: {selectedReport._id?.substring(0,8)}
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
              
              {/* Status */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                 <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Current Status:</span>
                 <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${
                    statusColors[(selectedReport.status || "Pending").toLowerCase().replace(/_/g, "-")] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                 }`}>
                   {selectedReport.status}
                 </span>
                 <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${
                    selectedReport.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    selectedReport.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                 }`}>
                   {selectedReport.severity || "N/A"} Severity
                 </span>
                 {selectedReport.isOverdue && (
                   <span className="px-3 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                     Overdue
                   </span>
                 )}
              </div>

              {/* Image Section */}
              {selectedReport.image?.url && (
                <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
                  <img src={selectedReport.image.url} alt="Report" className="w-full h-auto max-h-[300px] object-contain" />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Created At</p>
                  <p className="font-medium text-white text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Updated At</p>
                  <p className="font-medium text-white text-sm">{new Date(selectedReport.updatedAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Assigned To</p>
                  <p className="font-medium text-white text-sm">{selectedReport.assignedTo?.name || selectedReport.assignedTo?.userName || "N/A"}</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Deadline</p>
                  <p className={`font-medium text-sm ${selectedReport.isOverdue ? 'text-rose-400 font-bold' : 'text-white'}`}>
                    {selectedReport.deadline ? new Date(selectedReport.deadline).toLocaleString() : "No Deadline"}
                  </p>
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
                    {selectedReport.departments?.map((dept, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-xs font-medium">
                        {dept}
                      </span>
                    )) || <span className="text-slate-500 text-sm">None</span>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex justify-end">
               <button 
                  className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors"
                  onClick={() => setSelectedReport(null)}
               >
                 Close
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
