import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const PastReports = ({ reports = [] }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  if (!reports.length) {
    return (
        <div className="glass-card p-12 text-center border-dashed border-slate-700/50 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <i className="fas fa-history text-2xl text-slate-500"></i>
            </div>
            <p className="text-slate-400 font-medium">No past reports found.</p>
        </div>
    );
  }

  const statusColors = {
      'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      'in_progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'closed': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      'open': 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  const severityColors = {
      'low': 'text-emerald-400',
      'medium': 'text-amber-400',
      'high': 'text-rose-400'
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <div
          key={report._id}
          className="glass-card cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col h-full bg-slate-900/40 overflow-hidden"
          onClick={() => setSelectedReport(report)}
        >
          <div className="h-40 w-full overflow-hidden bg-slate-900 border-b border-slate-700/50 relative group-hover:opacity-90 transition-opacity">
            {report.image?.url ? (
              <img
                src={report.image.url}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <i className="fas fa-image text-3xl mb-2"></i>
                  <span className="text-sm font-medium">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
          </div>

          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{report.title}</h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 bg-slate-800/40 p-2 rounded border border-slate-700/30">
                <i className="far fa-calendar-check text-emerald-500/70"></i>
                <span>Resolved: <span className="text-slate-300">{new Date(report.createdAt).toLocaleDateString("en-GB")}</span></span>
            </div>
            
            <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-grow">
              {report.description || "No description available"}
            </p>
            
            <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-between items-center">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[report.status?.toLowerCase()] || statusColors['pending']}`}>
                  {report.status || "Pending"}
                </span>
                
                <span className={`text-xs font-bold uppercase ${severityColors[report.severity?.toLowerCase()] || 'text-slate-400'}`}>
                    {report.severity || "Low"}
                </span>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Modal for full details */}
      <Modal
        isOpen={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
      >
        {selectedReport && (
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
                <h2 className="text-2xl font-bold text-white mb-1 pr-8">{selectedReport.title}</h2>
                <button 
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors absolute top-6 right-6"
                    onClick={() => setSelectedReport(null)}
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                {selectedReport.image?.url && (
                <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
                  <img
                    src={selectedReport.image.url}
                    alt="Report"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Status</span>
                        <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider inline-block mt-1 ${statusColors[selectedReport.status?.toLowerCase()] || statusColors['pending']}`}>
                            {selectedReport.status}
                        </span>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Severity</span>
                        <span className={`font-bold text-sm uppercase block mt-1 ${severityColors[selectedReport.severity?.toLowerCase()] || 'text-slate-400'}`}>
                            {selectedReport.severity || "N/A"}
                        </span>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Resolved On</span>
                        <span className="font-medium text-sm text-white block mt-1">
                            {new Date(selectedReport.updatedAt).toLocaleDateString("en-GB")}
                        </span>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Departments</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedReport.departments?.map((dept, i) => (
                                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{dept}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Description</p>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedReport.description}
                        </p>
                    </div>

                    {selectedReport.location && (
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Location</p>
                                <p className="font-mono text-sm text-emerald-400">
                                    {selectedReport.location.coordinates[1].toFixed(4)},{" "}
                                    {selectedReport.location.coordinates[0].toFixed(4)}
                                </p>
                            </div>
                            <a href={`https://maps.google.com/?q=${selectedReport.location.coordinates[1]},${selectedReport.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center transition-colors" title="View on Map">
                                <i className="fas fa-map-marker-alt"></i>
                            </a>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-5 border-t border-slate-700/50 bg-slate-900/50 flex justify-end">
                <button
                    className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors"
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

export default PastReports;
