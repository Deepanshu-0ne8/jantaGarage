import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
// Import new resolution APIs
import { getReportsForVerification, acceptResolution, rejectResolution } from '../services/reportService'; 
import Navbar from './navbar'; 

const AttachmentModal = ({ imageUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
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

const labelize = (raw) => {
    if (!raw) return "";
    return String(raw)
      .toLowerCase()
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
};


const VerificationReportItem = ({ report, onResolutionAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const reportDetails = {
        locationLink: report.location?.coordinates ? 
            `https://maps.google.com/?q=${report.location.coordinates[1]},${report.location.coordinates[0]}` : 
            '#',
        id: report._id,
        title: report.title,
        description: report.description,
        severity: report.severity,
        departments: report.departments,
        status: report.status, // Should be IN_PROGRESS
        imageUrl: report.image?.url, 
    };

    const reportDate = new Date(report.createdAt).toLocaleDateString();
    
    const statusClass = reportDetails.status ? 
        reportDetails.status.toLowerCase().replace(/_/g, '-') : 
        '';

    const attachmentCount = reportDetails.imageUrl ? 1 : 0;
    
    // --- Handlers for Final Action ---
    const handleAccept = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Confirm resolution? This will mark the report as RESOLVED and remove it from your queue.")) {
            return;
        }

        try {
            const response = await acceptResolution(reportDetails.id); // Call the PATCH /toResolved/:id endpoint
            // Success: Remove item from queue and show message
            onResolutionAction('success', reportDetails.id, response); // response.message is used
        } catch (error) {
            console.error("Accept Failed:", error);
            onResolutionAction('error', reportDetails.id, error.message || 'Failed to verify resolution.');
        }
    };

    const handleReject = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Reject resolution? This will remove the report from your queue and notify staff to try again.")) {
            return;
        }

        try {
            const response = await rejectResolution(reportDetails.id); // Call the PATCH /reject/:id endpoint
            // Success: Remove item from queue and show message
            // Response object contains the message property
            onResolutionAction('info', reportDetails.id, response.message); 
        } catch (error) {
            console.error("Reject Failed:", error);
            onResolutionAction('error', reportDetails.id, error.message || 'Failed to reject resolution.');
        }
    };


    return (
        <>
            <div className={`glass-card overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-[0_8px_30px_rgba(59,130,246,0.15)] border-blue-500/30' : 'hover:border-slate-600'}`}>
                {/* Header (Summary) */}
                <div 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="hidden sm:flex w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i className="fas fa-clipboard-check text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-slate-500">#{reportDetails.id?.substring(0, 8) || 'N/A'}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                                    ACTION REQUIRED
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{reportDetails.title || 'Untitled Report'}</h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto">
                        <span className="text-sm text-slate-400 flex items-center gap-1">
                            <i className="far fa-calendar-alt"></i> {reportDate}
                        </span>
                        <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-500/20 text-blue-400' : ''}`}>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                    </div>
                </div>
                
                {/* Expandable Details */}
                {isOpen && (
                    <div className="border-t border-slate-700/50 bg-slate-900/30 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Report ID</span>
                                <p className="font-mono text-sm text-white">{reportDetails.id}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Severity</span>
                                <p className="font-medium text-white">{labelize(reportDetails.severity)}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Reported On</span>
                                <p className="font-medium text-white text-sm">{new Date(report.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Last Updated</span>
                                <p className="font-medium text-white text-sm">{new Date(report.updatedAt).toLocaleString()}</p>
                            </div>
                            
                            <div className="space-y-1 md:col-span-2">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Description</span>
                                <p className="text-slate-300 text-sm bg-slate-800/30 p-3 rounded border border-slate-700/50 whitespace-pre-wrap">
                                    {reportDetails.description || 'No detailed description provided.'}
                                </p>
                            </div>
                            
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Coordinates</span>
                                <p className="font-mono text-sm text-emerald-400">{report.location?.coordinates?.join(', ') || 'N/A'}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Location</span>
                                <div>
                                    <a href={reportDetails.locationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline">
                                        View Location <i className="fas fa-external-link-alt"></i>
                                    </a>
                                </div>
                            </div>
                            
                            <div className="space-y-1 md:col-span-2">
                                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Assigned Departments</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {reportDetails.departments?.map((dept, index) => (
                                        <span key={index} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-medium text-slate-300">
                                            {dept.split(' ')[0]}
                                        </span>
                                    )) || <span className="text-slate-500 text-sm">None</span>}
                                </div>
                            </div>
                        </div>

                        {/* Verification Actions */}
                        <div className="p-5 border-t border-slate-700/50 bg-slate-800/20 flex flex-wrap gap-3">
                            <button 
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                disabled={!attachmentCount}
                            >
                                <i className="fas fa-camera text-blue-400"></i> View Image ({attachmentCount})
                            </button>
                            
                            <div className="flex-grow flex flex-wrap justify-end gap-3">
                                <button 
                                    className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-sm font-semibold transition-colors flex items-center gap-2"
                                    onClick={handleReject}
                                >
                                    <i className="fas fa-times-circle"></i> Reject Resolution
                                </button>
                                
                                <button 
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
                                    onClick={handleAccept}
                                >
                                    <i className="fas fa-check-circle"></i> Verify & Accept Resolution
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Attachment Modal */}
            {isModalOpen && (
                <AttachmentModal 
                    imageUrl={reportDetails.imageUrl} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </>
    );
};


import { useQuery, useQueryClient } from '@tanstack/react-query';

const ReportVerificationPage = () => {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); 
    
    const { data: reports = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ["reports", "verification"],
        queryFn: getReportsForVerification,
        enabled: !authLoading && !!user,
    });

    const error = queryError ? queryError.message : null;

    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => setStatusMessage({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);


    // Handler that invalidates the verification query
    const handleResolutionAction = useCallback((type, reportId, message) => {
        setStatusMessage({ type, message });
        
        // Invalidate query to trigger background refetch
        queryClient.invalidateQueries({ queryKey: ["reports", "verification"] });
    }, [queryClient]);



    // --- Render Guards ---

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh]">
                    <div className="glass-card p-8 text-center text-rose-400 font-bold border-rose-500/30">
                        <i className="fas fa-lock text-3xl mb-3 block"></i>
                        Authentication Required
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
                    <p className="text-slate-400">Checking for reports requiring your verification...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <Navbar />
            
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                
                {statusMessage.message && (
                    <div className={`p-4 rounded-lg mb-8 border animate-in fade-in slide-in-from-top-2 flex items-center gap-3 shadow-lg ${
                        statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        statusMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                        statusMessage.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}>
                        {statusMessage.type === 'success' && <i className="fas fa-check-circle text-lg"></i>}
                        {statusMessage.type === 'error' && <i className="fas fa-exclamation-circle text-lg"></i>}
                        {statusMessage.type === 'info' && <i className="fas fa-info-circle text-lg"></i>}
                        <span className="font-medium text-sm">{statusMessage.message}</span>
                    </div>
                )}
                
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Resolution <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">Verification</span></h1>
                    <p className="text-slate-400 text-lg max-w-3xl">
                        These reports (filed by you) have been marked resolved by staff. Please verify the resolution or reject it if the issue persists.
                    </p>
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
                    {reports.map(report => (
                        <VerificationReportItem 
                            key={report._id} 
                            report={report} 
                            onResolutionAction={handleResolutionAction}
                        />
                    ))}
                </div>

                {(reports.length === 0 || error) && (
                    <div className="glass-card p-12 text-center border-dashed animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                            <i className="fas fa-clipboard-check text-4xl text-emerald-400"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-400">
                            {error || 'No reports currently require your verification. Great news!'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReportVerificationPage;
