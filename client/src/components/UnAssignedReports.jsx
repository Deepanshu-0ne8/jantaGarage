import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { getUnassignedReports } from '../services/reportService';
import Navbar from './navbar'; 
import { Link } from 'react-router-dom';

const SEVERITY_ORDER = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'Resolved'];

const DEPARTMENT_OPTIONS = [
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

// Overdue status is handled via database and Socket.IO events.

const AttachmentModal = ({ imageUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="glass-card w-full max-w-3xl flex flex-col shadow-2xl border-slate-700/60 animate-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Report Attachment</h3>
                    <button 
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-4 flex justify-center items-center bg-slate-900 min-h-[300px]">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Report Attachment" className="max-w-full max-h-[70vh] object-contain rounded" />
                    ) : (
                        <p className="text-slate-400 flex flex-col items-center gap-2">
                            <i className="fas fa-image text-3xl opacity-50"></i>
                            No image was attached to this report.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReportsFilter = ({ filters, setFilters, departmentsList }) => {
    
    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest('.filter-dropdown-toggle')) {
                setIsDeptDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDeptDropdownOpen]);

    const handleSeverityChange = (e) => {
        setFilters(prev => ({ ...prev, severity: e.target.value }));
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({ ...prev, status: e.target.value }));
    };

    const handleDepartmentChange = (dept) => {
        setFilters(prev => ({ 
            ...prev, 
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleReset = () => {
        setFilters({ severity: '', status: '', departments: [] });
    };
    
    const selectedDeptCount = filters.departments.length;
    const departmentToggleText = selectedDeptCount > 0 ? `${selectedDeptCount} Selected` : 'Filter by Department';

    return (
        <div className="glass-card p-4 md:p-6 mb-8 flex flex-col md:flex-row flex-wrap items-end gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Severity</label>
                <div className="relative">
                    <select 
                        value={filters.severity} 
                        onChange={handleSeverityChange}
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2.5 appearance-none cursor-pointer"
                    >
                        <option value="">All Severities</option>
                        {SEVERITY_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs"></i>
                </div>
            </div>
            
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
                <div className="relative">
                    <select 
                        value={filters.status} 
                        onChange={handleStatusChange}
                        className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2.5 appearance-none cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs"></i>
                </div>
            </div>
            
            <div className="flex-1 min-w-[250px] flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</label>
                <button 
                    type="button"
                    className={`filter-dropdown-toggle w-full flex items-center justify-between bg-slate-900/50 border ${isDeptDropdownOpen ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-slate-700/50'} text-slate-200 text-sm rounded-lg p-2.5 text-left transition-all`}
                    onClick={() => setIsDeptDropdownOpen(prev => !prev)}
                >
                    <span className="truncate">{departmentToggleText}</span>
                    <i className={`fas fa-chevron-down text-slate-500 text-xs transition-transform duration-300 ${isDeptDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {isDeptDropdownOpen && (
                    <div ref={dropdownRef} className="absolute top-[100%] left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                        {departmentsList.map(d => (
                            <div 
                                key={d} 
                                className="px-4 py-2 hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors" 
                                onClick={() => handleDepartmentChange(d)}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.departments.includes(d) ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900/50'}`}>
                                    {filters.departments.includes(d) && <i className="fas fa-check text-[10px] text-white"></i>}
                                </div>
                                <span className="text-sm text-slate-300">{d}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <button 
                className="h-[42px] px-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                onClick={handleReset}
            >
                <i className="fas fa-undo text-xs"></i> Reset
            </button>
        </div>
    );
};


const UnassignedReportItem = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOverdue = !!report.isOverdue;
  const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
  const fullDeadlineText = report.deadline ? new Date(report.deadline).toLocaleString('en-GB') : 'N/A';
  
  const reportDetails = {
    locationLink: report.location?.coordinates
      ? `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}`
      : '#',
    id: report._id,
    title: report.title,
    description: report.description,
    severity: report.severity,
    departments: report.departments,
    reportDate: new Date(report.createdAt).toLocaleDateString(),
    imageUrl: report.image?.url,
    deadline: report.deadline,
  };

  const severityClass = reportDetails.severity?.toLowerCase() || 'low';
  const attachmentCount = reportDetails.imageUrl ? 1 : 0;

  const severityColors = {
      'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };


  const handleSummaryClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <>
    <div className={`glass-card mb-4 transition-all duration-300 ${isOpen ? 'ring-1 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'hover:border-slate-600'} ${isOverdue ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : ''}`}>
      <div 
        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none relative overflow-hidden" 
        onClick={handleSummaryClick}
      >
        {isOverdue && (
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden hidden md:block">
                <div className="absolute top-2 -right-6 bg-rose-500 text-white text-[9px] font-bold py-1 px-8 transform rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                    OVERDUE
                </div>
            </div>
        )}
        
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-xs font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                # {reportDetails.id?.substring(0, 8) || 'N/A'}
            </span>
            {isOverdue && (
                <span className="md:hidden bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">OVERDUE</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white truncate transition-colors hover:text-blue-400">
            {reportDetails.title || 'Untitled Report'}
          </h3>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 shrink-0 z-10 bg-slate-900/40 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none border border-slate-700/50 md:border-none mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <i className="far fa-clock text-slate-500"></i>
            <span className={`text-sm font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>{deadlineText}</span>
          </div>
          <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${severityColors[severityClass]}`}>
            {reportDetails.severity}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ml-auto md:ml-0 ${isOpen ? 'bg-blue-500/20 text-blue-400 rotate-180' : 'bg-slate-800 text-slate-400'}`}>
            <i className="fas fa-chevron-down text-sm"></i>
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            <div className="p-6 border-t border-slate-700/50 bg-slate-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 flex flex-col justify-center items-center text-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Current Status</span>
                    <span className="px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-md text-xs font-bold tracking-widest uppercase">
                        Unassigned
                    </span>
                </div>
                
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">Target Deadline</span>
                    <span className={`font-medium text-sm ${isOverdue ? 'text-rose-400' : 'text-white'}`}>{fullDeadlineText}</span>
                </div>

                <div className="md:col-span-2 bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-2">Description</span>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {reportDetails.description || 'No detailed description provided.'}
                    </p>
                </div>

                <div className="md:col-span-2 bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-2">Target Departments</span>
                    <div className="flex flex-wrap gap-2">
                        {reportDetails.departments?.length ? (
                        reportDetails.departments.map((dept, index) => (
                            <span key={index} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium">
                            {dept.split(' ')[0]} {/* Simplified dept name as in original */}
                            </span>
                        ))
                        ) : (
                        <span className="text-slate-500 text-sm italic">None specified</span>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">Coordinates</span>
                    <span className="font-mono text-sm text-emerald-400">{report.location?.coordinates?.join(', ') || 'N/A'}</span>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-2">Location Map</span>
                    <a
                        href={reportDetails.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg transition-colors w-fit"
                    >
                        View on Google Maps <i className="fas fa-external-link-alt"></i>
                    </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700/50 justify-end">
                <button
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                    disabled={!attachmentCount}
                >
                    <i className="fas fa-camera text-blue-400"></i> View Image ({attachmentCount})
                </button>
                
                <Link
                  to={`/staffList?reportId=${reportDetails.id}`}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="fas fa-user-tag"></i> Assign to Staff
                </Link>
              </div>
            </div>
        </div>
      </div>
    </div>
    
    {isModalOpen && (
        <AttachmentModal 
            imageUrl={reportDetails.imageUrl} 
            onClose={() => setIsModalOpen(false)} 
        />
    )}
    </>
  );
};


import { useQuery } from '@tanstack/react-query';

const UnassignedReportsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({ severity: '', status: '', departments: [] });

  const isAuthorized = user?.role === 'admin';

  const { data: reports = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["reports", "unassigned"],
    queryFn: getUnassignedReports,
    enabled: !authLoading && !!user && isAuthorized,
  });

  const error = queryError ? queryError.message : null;

  // Filter, Split, and Sort reports into two sections (runs when reports or filters change)
  const { overdueReports, otherReports } = useMemo(() => {
      // 1. Apply user filters to the master list
      const filtered = reports.filter(report => {
          const severityMatch = filters.severity ? report.severity === filters.severity : true;
          const statusMatch = filters.status ? report.status === filters.status : true; 
          
          const departmentMatch = filters.departments.length > 0 
              ? report.departments.some(dept => filters.departments.includes(dept))
              : true;
  
          return severityMatch && statusMatch && departmentMatch;
      });

      // 2. Separate into Overdue and Others
      const overdue = [];
      const others = [];

      filtered.forEach(report => {
          if (report.isOverdue) {
              overdue.push(report);
          } else {
              others.push(report);
          }
      });

      // 3. Sort Overdue (Primary: Severity only)
      const sortedOverdue = overdue.sort((a, b) => {
          return (SEVERITY_ORDER[a.severity] || 99) - (SEVERITY_ORDER[b.severity] || 99);
      });

      // 4. Sort Others (Primary: Severity; Secondary: Deadline; Tertiary: CreatedAt)
      const sortedOthers = others.sort((a, b) => {
          const orderA = SEVERITY_ORDER[a.severity] || 99;
          const orderB = SEVERITY_ORDER[b.severity] || 99;

          // Primary Sort: Severity (High first)
          if (orderA !== orderB) return orderA - orderB;

          // Secondary Sort: Deadline (Earliest deadline time first - full timestamp)
          const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          if (deadlineA !== deadlineB) {
              return deadlineA - deadlineB; 
          }

          // Tertiary Sort: Creation Date (Newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      return { overdueReports: sortedOverdue, otherReports: sortedOthers };
  }, [reports, filters]);



  const totalFilteredReports = overdueReports.length + otherReports.length;


  if (authLoading || !user)
    return (
        <div className="min-h-screen bg-slate-950 font-sans">
            <Navbar />
            <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400">Authenticating user...</p>
            </div>
        </div>
    );

  if (!isAuthorized)
    return (
        <div className="min-h-screen bg-slate-950 font-sans">
            <Navbar />
            <div className="flex justify-center items-center h-[80vh]">
                <div className="glass-card p-8 text-center text-rose-400 font-bold border-rose-500/30 max-w-md">
                    <i className="fas fa-lock text-3xl mb-3 block"></i>
                    <h2 className="text-xl mb-2">Access Denied</h2>
                    <p className="text-slate-400 font-normal">You must be an <b className="text-white">Admin</b> to view and manage unassigned reports.</p>
                </div>
            </div>
        </div>
    );

  if (loading)
    return (
        <div className="min-h-screen bg-slate-950 font-sans">
            <Navbar />
            <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400">Fetching unassigned reports...</p>
            </div>
        </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Unassigned <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-400">Queue</span></h1>
          <p className="text-slate-400 text-lg max-w-3xl">
            Admin View: <b className="text-white">{totalFilteredReports} reports</b> currently require staff assignment.
          </p>
        </header>

        <ReportsFilter filters={filters} setFilters={setFilters} departmentsList={DEPARTMENT_OPTIONS} />

        {/* --- 1. OVERDUE REPORTS SECTION --- */}
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h2 className="text-2xl font-bold text-rose-400">Priority Queue <span className="text-slate-500 text-lg ml-2 font-normal">(Overdue: {overdueReports.length})</span></h2>
                <div className="h-px bg-slate-800 flex-grow ml-4"></div>
            </div>
            
            <div className="space-y-4">
                {overdueReports.length > 0 ? (
                    overdueReports.map((report) => (
                        <UnassignedReportItem key={report._id} report={report} />
                    ))
                ) : (
                    <div className="glass-card p-8 text-center border-dashed border-slate-700/50 opacity-70">
                        <i className="fas fa-check-circle text-3xl text-emerald-500/70 mb-3 block"></i>
                        <span className="text-slate-400">No overdue reports found matching filters. Great!</span>
                    </div>
                )}
            </div>
        </section>

        {/* --- 2. REGULAR REPORTS SECTION --- */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <i className="fas fa-clock"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Standard Queue <span className="text-slate-500 text-sm ml-2 font-normal">(Total: {otherReports.length})</span></h2>
                <div className="h-px bg-slate-800 flex-grow ml-4"></div>
            </div>
            
            <div className="space-y-4">
                {otherReports.length > 0 ? (
                    otherReports.map((report) => (
                        <UnassignedReportItem key={report._id} report={report} />
                    ))
                ) : (
                    <div className="glass-card p-8 text-center border-dashed border-slate-700/50 opacity-70">
                        <i className="fas fa-clipboard text-3xl text-slate-600 mb-3 block"></i>
                        <span className="text-slate-400">No standard priority reports found matching filters.</span>
                    </div>
                )}
            </div>
        </section>


        {(totalFilteredReports === 0 && !error) && (
          <div className="glass-card p-16 mt-10 text-center border-dashed border-slate-700/50 flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                <i className="fas fa-clipboard-check text-5xl text-emerald-500/70"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Queue is Empty</h3>
            <p className="text-slate-400">No unassigned reports found matching your filters. Great work!</p>
          </div>
        )}
        {error && (
            <div className="glass-card p-8 mt-10 text-center border-rose-500/30 bg-rose-500/5">
                <i className="fas fa-exclamation-triangle text-4xl text-rose-400 mb-4 block"></i>
                <h3 className="text-lg font-bold text-white mb-2">Error Loading Queue</h3>
                <p className="text-rose-400/80">{error}</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default UnassignedReportsPage;
