import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import { getReportById } from '../services/reportService';
import { useQuery } from '@tanstack/react-query';

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

  const { data: report = null, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["reports", "detail", id],
    queryFn: () => getReportById(id),
    enabled: !!id,
  });

  const error = queryError ? (queryError.message || "Could not load report details.") : null;


  // --- Render Guards ---
  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <Navbar />
        <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400">Loading report details...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="glass-card p-8 text-center border-rose-500/30 bg-rose-500/5">
                <i className="fas fa-exclamation-triangle text-4xl text-rose-400 mb-4 block"></i>
                <h2 className="text-xl font-bold text-white mb-2">Error Loading Report</h2>
                <p className="text-rose-400/80 mb-6">{error}</p>
                <button 
                    className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium transition-colors"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        </div>
      </div>
    );

  if (!report)
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="glass-card p-12 text-center border-dashed border-slate-700/50 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                    <i className="fas fa-search text-3xl text-slate-500"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Report Not Found</h3>
                <p className="text-slate-400 mb-6">The report you are looking for does not exist or you do not have permission to view it.</p>
                <button 
                    className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium transition-colors"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        </div>
      </div>
    );

  // --- Data Preparation ---
  const severityClass = (report.severity || 'low').toLowerCase();
  const statusClass = (report.status || 'open').toLowerCase().replace(/_/g, '-');
  const coords = report.location?.coordinates;
  const locationLink = coords
    ? `https://maps.google.com/?q=${coords[1]},${coords[0]}`
    : null;

  const statusColors = {
      'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'closed': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      'open': 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  const severityColors = {
      'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden pb-12">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <button 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium w-fit group" 
            onClick={() => navigate(-1)}
          >
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                 <i className="fas fa-arrow-left"></i> 
             </div>
             Back
          </button>
          
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-white">{report.title || "Untitled Report"}</h1>

          <div className="flex flex-wrap items-center gap-3 md:gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ID</span>
                <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">#{report._id.substring(0, 8)}</span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status</span>
                <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${statusColors[statusClass] || statusColors['pending']}`}>
                    {labelize(report.status)}
                </span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Severity</span>
                <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${severityColors[severityClass] || severityColors['low']}`}>
                    {labelize(report.severity)}
                </span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Reported By</span>
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <i className="fas fa-user-circle text-slate-500"></i>
                    {report.createdBy?.name || report.createdBy?.userName || 'Citizen'}
                </span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filed On</span>
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <i className="far fa-calendar-alt text-slate-500"></i>
                    {formatDate(report.createdAt)}
                </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Details */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="glass-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-4">
                  <i className="fas fa-clipboard-list text-blue-400"></i> Assignment Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Assigned Staff</span>
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                          <i className="fas fa-user-tie text-blue-400/70"></i>
                          {report.assignedTo?.name || report.assignedTo?.userName || 'Unassigned'}
                      </span>
                  </div>
                  <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Departments</span>
                      <div className="flex flex-wrap gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30 min-h-[44px]">
                          {report.departments?.length > 0 ? (
                              report.departments.map((dept, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium">
                                      {dept}
                                  </span>
                              ))
                          ) : (
                              <span className="text-sm text-slate-500">None</span>
                          )}
                      </div>
                  </div>
                  <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Deadline</span>
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                          <i className="far fa-clock text-rose-400/70"></i>
                          {formatDate(report.deadline)}
                      </span>
                  </div>
                  <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Last Updated</span>
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                          <i className="fas fa-history text-slate-500"></i>
                          {formatDate(report.updatedAt)}
                      </span>
                  </div>
              </div>
            </div>

            <div className="glass-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-4">
                  <i className="fas fa-align-left text-blue-400"></i> Description
              </h2>
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/30">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {report.description || "No description provided for this issue."}
                  </p>
              </div>
            </div>
          </div>

          {/* Right Side - Media & Location */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-slate-700/50">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <i className="fas fa-camera text-blue-400"></i> Attachment
                  </h2>
              </div>
              <div className="bg-slate-900 p-4 flex justify-center">
                  {report.image?.url ? (
                    <img
                      src={report.image.url}
                      alt="Report"
                      className="max-w-full h-auto rounded-lg border border-slate-700/50 shadow-md"
                      onError={(e) => { e.target.src = "https://placehold.co/300x200/1e293b/94a3b8?text=Image+Unavailable"; }}
                    />
                  ) : (
                    <div className="w-full aspect-video bg-slate-800/50 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                        <i className="fas fa-image text-4xl mb-3 opacity-50"></i>
                        <span className="text-sm font-medium">No image attached</span>
                    </div>
                  )}
              </div>
            </div>

            <div className="glass-card p-5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-3">
                  <i className="fas fa-map-marked-alt text-blue-400"></i> Location
              </h2>
              
              <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 mb-4">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Coordinates</span>
                  <p className="font-mono text-emerald-400">
                      {coords ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : "N/A"}
                  </p>
              </div>
              
              {locationLink ? (
                <a 
                    href={locationLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-external-link-alt"></i> View on Google Maps
                </a>
              ) : (
                  <button disabled className="w-full py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                      <i className="fas fa-map-marker-slash"></i> Map Unavailable
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
