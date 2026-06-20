import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/authContext';
// NOTE: Assuming this service function hits the /api/v1/reports/assignedReports route
import { getAssignedReportsByAdmin } from '../services/reportService'; 
import Navbar from './navbar';
import Modal from 'react-modal';

// Import constants and helpers from the types file (assuming modular project structure)
import { 
    SEVERITY_ORDER, 
    SEVERITY_OPTIONS, 
    STATUS_OPTIONS, 
    DEPARTMENT_OPTIONS, 
    labelize 
} from './AdminAssignedReports.types.js'; 

Modal.setAppElement('#root');

// --- Attachment Modal Component (New) ---
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


// --- Helper Components (Modal and Filter) ---

const ReportFilter = ({ filters, setFilters }) => {
    
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

    const handleChange = (field) => (e) => {
        setFilters(prev => ({ ...prev, [field]: e.target.value }));
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
                        onChange={handleChange('severity')}
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
                        onChange={handleChange('status')}
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
                        {DEPARTMENT_OPTIONS.map(d => (
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


const ReportDetailsModal = ({ report, onClose }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false); // State for image viewer
    
    const coords = report.location?.coordinates;
    const locationLink = coords 
        ? `https://maps.google.com/?q=${coords[1]},${coords[0]}` 
        : null;

    const formattedDeadline = report.deadline ? new Date(report.deadline).toLocaleString() : 'N/A';
    const attachmentCount = report.image?.url ? 1 : 0;

    const statusColors = {
        'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'open': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };

    const severityColors = {
        'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };

    return (
        <>
        <Modal
            isOpen={true}
            onRequestClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
            overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
        >
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 pr-8">{report.title}</h2>
                        <p className="text-xs text-slate-400 font-mono">
                            ID: {report._id?.substring(0,8)}
                        </p>
                    </div>
                    <button 
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors absolute top-6 right-6"
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    
                    {report.image?.url && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
                            <img src={report.image.url} alt="Report Image" className="w-full h-auto max-h-[300px] object-contain" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Status</span>
                            <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider inline-block mt-1 ${
                                statusColors[(report.status || "open").toLowerCase().replace(/_/g, "-")] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}>
                                {labelize(report.status)}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Severity</span>
                            <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider inline-block mt-1 ${
                                severityColors[(report.severity || "low").toLowerCase()] || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                                {labelize(report.severity)}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Target Deadline</span>
                            <span className={`font-medium text-sm block mt-1 ${report.isOverdue ? 'text-rose-400' : 'text-white'}`}>
                                {formattedDeadline}
                            </span>
                        </div>
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Filed On</span>
                            <span className="font-medium text-sm text-white block mt-1">
                                {new Date(report.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="md:col-span-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">Assigned To</span>
                            <span className="font-medium text-sm text-white block mt-1 flex items-center gap-2">
                                <i className="fas fa-user-circle text-slate-400"></i>
                                {report.assignedTo?.name || report.assignedTo?.userName || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Description</p>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {report.description || 'No description provided.'}
                            </p>
                        </div>
                        
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Departments</p>
                            <div className="flex flex-wrap gap-2">
                                {report.departments?.map((dept, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-medium">
                                        {dept}
                                    </span>
                                )) || <span className="text-slate-500 text-sm">None</span>}
                            </div>
                        </div>

                        {report.location && (
                            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Coordinates</p>
                                    <p className="font-mono text-sm text-emerald-400">
                                        {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                                    </p>
                                </div>
                                {locationLink && (
                                    <a href={locationLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
                                        <i className="fas fa-map-marker-alt"></i> View on Map
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-700/50 bg-slate-900/50 flex flex-wrap gap-3 justify-between items-center">
                    <button
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setIsImageModalOpen(true)}
                        disabled={!attachmentCount}
                    >
                        <i className="fas fa-camera text-blue-400"></i> View Image ({attachmentCount})
                    </button>
                    <button 
                        className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>

        {/* Attachment Modal */}
        {isImageModalOpen && (
            <AttachmentModal 
                imageUrl={report.image?.url} 
                onClose={() => setIsImageModalOpen(false)} 
            />
        )}
        </>
    );
};

// --- Report Card Component ---
const AssignedReportCard = ({ report, onClick }) => {
    const statusClass = (report.status || 'Pending').toLowerCase().replace(/_/g, '-');
    const severityClass = (report.severity || 'Low').toLowerCase();

    const deadlineText = report.deadline ? new Date(report.deadline).toLocaleDateString('en-GB') : 'N/A';
    const isOverdue = !!report.isOverdue;
    
    // Use updatedAt for resolved reports status if available
    const lastDate = report.status === 'Resolved' || report.status === 'CLOSED'
        ? new Date(report.updatedAt).toLocaleDateString('en-GB')
        : deadlineText;
    
    const dateLabel = report.status === 'Resolved' || report.status === 'CLOSED' ? 'Completed:' : 'Due:';

    const statusColors = {
        'pending': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'open': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };

    const severityColors = {
        'low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'high': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };

    return (
        <div 
            className={`glass-card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden ${isOverdue ? 'ring-1 ring-rose-500/50' : ''}`}
            onClick={() => onClick(report)}
            role="button"
            tabIndex={0}
        >
            {isOverdue && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-2 -right-6 bg-rose-500 text-white text-[9px] font-bold py-1 px-8 transform rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        OVERDUE
                    </div>
                </div>
            )}
            
            <div className="flex-grow">
                <div className="flex items-start justify-between gap-3 mb-3 pr-6">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">{report.title}</h3>
                </div>
                
                <p className="text-sm text-slate-400 mb-4 flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                    <i className="fas fa-user-circle"></i>
                    <span className="truncate">To: <span className="text-white font-medium">{report.assignedTo?.name || report.assignedTo?.userName || 'N/A'}</span></span>
                </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-slate-700/50">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[statusClass] || statusColors['open']}`}>
                    {labelize(report.status)}
                </span>
                
                <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <i className={dateLabel === 'Due:' ? "far fa-clock" : "fas fa-check"}></i> 
                        <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}>{lastDate}</span>
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${severityColors[severityClass]?.split(' ')[0] || 'bg-slate-500'} border ${severityColors[severityClass]?.split(' ')[2] || 'border-slate-500'} shadow-[0_0_5px_currentColor]`} title={`Severity: ${labelize(report.severity)}`}></span>
                </div>
            </div>
        </div>
    );
};


import { useQuery } from '@tanstack/react-query';

// --- Main Component ---
const AdminAssignedReports = () => {
    const { user, loading: authLoading } = useAuth();
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ severity: '', status: '', departments: [] });

    const isAuthorized = user?.role === 'admin';

    const { data: reports = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ["reports", "assignedByAdmin"],
        queryFn: getAssignedReportsByAdmin,
        enabled: !authLoading && !!user && isAuthorized,
    });

    useEffect(() => {
        if (queryError) {
            setError(queryError.message || "Failed to fetch assigned reports.");
        } else {
            setError(null);
        }
    }, [queryError]);

    // --- FILTERING AND SORTING LOGIC ---
    const { activeReports, pastReports, totalFilteredCount } = useMemo(() => {
        // 1. Apply user filters
        const filtered = reports.filter(report => {
            const severityMatch = filters.severity ? report.severity === filters.severity : true;
            const statusMatch = filters.status ? report.status === filters.status : true;
            
            const departmentMatch = filters.departments.length > 0 
                ? report.departments.some(dept => filters.departments.includes(dept))
                : true;
    
            return severityMatch && statusMatch && departmentMatch;
        });

        // 2. Separate into Active (OPEN/IN_PROGRESS) and Past (Resolved/Closed)
        const unresolved = filtered.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
        const past = filtered.filter(r => r.status === 'Resolved' || r.status === 'CLOSED');

        // 3. Sort Active Reports (Priority: Overdue, Severity, Deadline Time)
        const sortedActive = unresolved.sort((a, b) => {
            const isAOverdue = !!a.isOverdue;
            const isBOverdue = !!b.isOverdue;

            // Primary Sort: Overdue status (Overdue first)
            if (isAOverdue !== isBOverdue) {
                return isAOverdue ? -1 : 1;
            }

            // Secondary Sort: Severity (High first)
            const orderA = SEVERITY_ORDER[a.severity] || 99;
            const orderB = SEVERITY_ORDER[b.severity] || 99;
            if (orderA !== orderB) return orderA - orderB;
            
            // Tertiary Sort: Deadline Time (Earliest deadline first)
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

            if (deadlineA !== deadlineB) {
                return deadlineA - deadlineB;
            }
            
            // Final Sort: Creation Date (Newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // 4. Sort Past Reports (Newest completion date/update date first)
        const sortedPast = past.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));


        return { 
            activeReports: sortedActive, 
            pastReports: sortedPast,
            totalFilteredCount: filtered.length
        };
    }, [reports, filters]);



    // --- Render Guards ---
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-slate-400">Authenticating user...</p>
                </div>
            </div>
        );
    }
    
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh]">
                    <div className="glass-card p-8 text-center text-rose-400 font-bold border-rose-500/30 max-w-md">
                        <i className="fas fa-lock text-3xl mb-3 block"></i>
                        <h2 className="text-xl mb-2">Access Denied (403)</h2>
                        <p className="text-slate-400 font-normal">This page is reserved for <span className="text-white font-medium">Admin</span> access only.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-slate-400">Fetching assigned reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                
                <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Reports <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Assigned By You</span></h1>
                    <p className="text-slate-400 text-lg max-w-3xl">
                        Monitoring <span className="text-white font-bold">{totalFilteredCount}</span> reports assigned by you to staff members.
                    </p>
                </header>
                
                <ReportFilter filters={filters} setFilters={setFilters} />
                
                {/* --- 1. UNRESOLVED/ACTIVE REPORTS SECTION --- */}
                <section className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Active Tasks <span className="text-slate-500 text-lg ml-2">({activeReports.length})</span></h2>
                        <div className="h-px bg-slate-800 flex-grow ml-4"></div>
                    </div>
                    
                    {(activeReports.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {activeReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center border-dashed border-slate-700/50">
                            <i className="fas fa-clipboard-check text-4xl text-slate-500 mb-4"></i>
                            <p className="text-slate-400">No active tasks found matching filters.</p>
                        </div>
                    )}
                </section>

                {/* --- 2. RESOLVED / PAST REPORTS SECTION --- */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
                    <div className="flex items-center gap-3 mb-6 opacity-70 hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <i className="fas fa-history"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-300">Resolved/Past Tasks <span className="text-slate-500 text-sm ml-2">({pastReports.length})</span></h2>
                        <div className="h-px bg-slate-800 flex-grow ml-4"></div>
                    </div>
                    
                    {(pastReports.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
                            {pastReports.map(report => (
                                <AssignedReportCard 
                                    key={report._id} 
                                    report={report} 
                                    onClick={setSelectedReport}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center border-dashed border-slate-700/50 opacity-70">
                            <i className="fas fa-check-double text-3xl text-slate-600 mb-3"></i>
                            <p className="text-slate-500 text-sm">No completed tasks found matching filters.</p>
                        </div>
                    )}
                </section>

                {/* Catch-all for when filters hide everything */}
                {totalFilteredCount === 0 && !error && (
                    <div className="glass-card p-16 mt-10 text-center border-dashed border-slate-700/50 flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                            <i className="fas fa-search text-5xl text-slate-500"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
                        <p className="text-slate-400 max-w-md">No reports found matching the current filters. Try adjusting your search criteria.</p>
                    </div>
                )}
                {error && (
                    <div className="glass-card p-8 mt-10 text-center border-rose-500/30 bg-rose-500/5">
                        <i className="fas fa-exclamation-triangle text-4xl text-rose-400 mb-4"></i>
                        <h3 className="text-lg font-bold text-white mb-2">Error Loading Data</h3>
                        <p className="text-rose-400/80">{error}</p>
                    </div>
                )}
            </main>
            
            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportDetailsModal 
                    report={selectedReport} 
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
};

export default AdminAssignedReports;
