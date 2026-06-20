import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getAllEligibleStaff } from '../services/reportService';
import { assignReportToStaff } from '../services/UserServices';
import Navbar from './navbar';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Utility function to get query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// --- Avatar Helper Component ---
const StaffAvatar = ({ staff, isDetail = false }) => {
    const sizeClass = isDetail ? 'w-20 h-20 text-3xl' : 'w-12 h-12 text-lg';
    const initial = staff.name ? staff.name[0].toUpperCase() : staff.userName[0].toUpperCase();
    
    if (staff.displayPic?.url) {
        return <img src={staff.displayPic.url} alt={staff.name || staff.userName} className={`${sizeClass} rounded-full object-cover border-2 border-slate-700/50 shadow-md flex-shrink-0`} />;
    }
    
    return <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]`}>{initial}</div>;
};


// --- Staff Detail Modal ---
const StaffDetailModal = ({ staff, onClose, onAssign, isAssignmentLoading, currentReportId }) => {
    
    // Workload field removed
    const relevantFields = [
        { label: "Role", value: staff.role.toUpperCase(), icon: "fa-user-shield" },
        { label: "Email", value: staff.email, icon: "fa-envelope" },
        { label: "Contact", value: staff.contact || 'N/A', icon: "fa-phone" },
        { label: "Departments", value: staff.departments.join(', '), icon: "fa-sitemap", isArray: true },
    ];
    
    return (
        <Modal
            isOpen={true}
            onRequestClose={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
            overlayClassName="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
        >
            <div className="glass-card w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-slate-700/60 relative p-6 md:p-8">
                <button 
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors absolute top-4 right-4 z-10"
                    onClick={onClose}
                >
                    <i className="fas fa-times"></i>
                </button>
                
                <div className="flex flex-col items-center text-center mb-8 relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full w-32 h-32 mx-auto -z-10 top-0"></div>
                    <StaffAvatar staff={staff} isDetail={true} />
                    <h2 className="text-2xl font-bold text-white mt-4 tracking-tight">{staff.name || staff.userName}</h2>
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 mt-2">
                        {staff.role}
                    </span>
                </div>
                
                <div className="space-y-4 mb-8 bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 shadow-inner">
                    {relevantFields.map(field => (
                        <div key={field.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 w-32 shrink-0">
                                <i className={`fas ${field.icon} w-4 text-center opacity-70`}></i> {field.label}
                            </span>
                            
                            {field.isArray ? (
                                <span className="text-sm text-slate-300 font-medium">
                                    {staff.departments.map((d, i) => (
                                        <span key={i} className="inline-block mr-1.5 mb-1.5 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs">{d}</span>
                                    ))}
                                </span>
                            ) : (
                                <span className="text-sm text-slate-200 font-medium break-all">{field.value}</span>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => onAssign(staff.id, currentReportId, staff.name)}
                    disabled={isAssignmentLoading}
                >
                    {isAssignmentLoading ? (
                        <><i className="fas fa-spinner fa-spin"></i> Assigning...</>
                    ) : (
                        <><i className="fas fa-user-check"></i> Assign Report Now</>
                    )}
                </button>
            </div>
        </Modal>
    );
};


// Component to display a single staff member card
const StaffItem = ({ staff, onCardClick }) => (
    <div 
        className="glass-card p-5 cursor-pointer hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col h-full bg-slate-900/40 relative overflow-hidden" 
        onClick={() => onCardClick(staff)}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <StaffAvatar staff={staff} isDetail={false} />
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{staff.name || staff.userName}</h3>
                <p className="text-sm text-slate-400 truncate">{staff.email}</p>
            </div>
        </div>
        
        {/* Workload display removed */}

        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-700/50 relative z-10">
            {staff.departments.map(dept => (
                <span key={dept} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
                    {dept.split(' ')[0]}
                </span>
            ))}
        </div>
    </div>
);

// --- Main Staff List Component ---
const StaffList = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const query = useQuery();
    const reportId = query.get('reportId');

    // New state to hold staff grouped by the report's required departments
    const [staffsByDepartment, setStaffsByDepartment] = useState({}); 
    const [reportDepartments, setReportDepartments] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
    const [assignmentStatus, setAssignmentStatus] = useState(null);

    const isAuthorized = user?.role === 'admin'; 

    // --- LOGIC: Group staff by report department ---
    const groupStaffByDepartment = (fetchedStaff, departmentsRequired) => {
        const grouped = {};

        // 1. Initialize groups for every department the report requires
        departmentsRequired.forEach(dept => {
            grouped[dept] = [];
        });

        // 2. Iterate through staff and place them in all relevant department sections
        fetchedStaff.forEach(staff => {
            // Check which of the report's required departments this staff member handles
            departmentsRequired.forEach(reportDept => {
                if (staff.departments && staff.departments.includes(reportDept)) {
                    grouped[reportDept].push({
                        ...staff,
                        id: staff._id, // Ensure ID is present for keying
                    });
                }
            });
        });
        return grouped;
    };

    const fetchStaff = useCallback(async () => {
        if (!reportId || !isAuthorized) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Assume getAllEligibleStaff fetches data from the backend route
            const fetchedResponse = await getAllEligibleStaff(reportId);
            
            // Correctly extract staff and departments from the confirmed API response structure
            const fetchedStaff = fetchedResponse.data?.staffs || [];
            const departmentsRequired = fetchedResponse.data?.reportDepartments || []; 

            // Set the extracted departments
            setReportDepartments(departmentsRequired);

            // Group the staff based on the extracted required departments
            const groupedStaff = groupStaffByDepartment(fetchedStaff, departmentsRequired);
            setStaffsByDepartment(groupedStaff);

        } catch (err) {
            const errMsg = err.message || "Failed to fetch eligible staff or report details.";
            console.error("Fetch Staff Error:", errMsg);
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    }, [reportId, isAuthorized]);

    useEffect(() => {
        if (!user || authLoading) return;
        
        if (!isAuthorized || !reportId) {
            navigate('/home'); 
            return;
        }
        
        fetchStaff();
    }, [user, authLoading, isAuthorized, reportId, fetchStaff, navigate]);
    
    
    const handleAssignStaff = async (staffId, currentReportId, staffName) => {
        if (!window.confirm(`Confirm assigning report #${currentReportId.substring(0, 8)} to ${staffName}?`)) {
            return;
        }
        
        setIsAssignmentLoading(true);
        setAssignmentStatus(null);
        
        try {
            const response = await assignReportToStaff(staffId, currentReportId); 
            
            setAssignmentStatus({ type: 'success', message: response.message || `Successfully assigned report to ${staffName}.` });
            setSelectedStaff(null); 
            
            setTimeout(() => navigate('/unAssignedReports'), 1500); 

        } catch (error) {
            console.error("Assignment Failed:", error);
            const errMsg = error.message || 'Assignment failed due to server error.';
            setAssignmentStatus({ type: 'error', message: errMsg });
        } finally {
            setIsAssignmentLoading(false);
        }
    };


    if (authLoading || !reportId) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="flex justify-center items-center h-[80vh] flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-slate-400">{loading ? 'Loading eligible staff...' : 'Authorizing access...'}</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 font-sans">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <div className="glass-card p-8 text-center border-rose-500/30 bg-rose-500/5">
                        <i className="fas fa-exclamation-triangle text-4xl text-rose-400 mb-4 block"></i>
                        <h2 className="text-xl font-bold text-white mb-2">Error Loading Staff</h2>
                        <p className="text-rose-400/80 mb-6">{error}</p>
                        <button 
                            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium transition-colors"
                            onClick={() => navigate('/unAssignedReports')}
                        >
                            Return to Queue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const allDepartments = Object.keys(staffsByDepartment);
    const hasAnyStaff = allDepartments.some(dept => staffsByDepartment[dept].length > 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <Navbar />
            
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button 
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium w-fit group" 
                        onClick={() => navigate('/unAssignedReports')}
                    >
                         <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                             <i className="fas fa-arrow-left"></i> 
                         </div>
                         Back to Queue
                    </button>
                    
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Assign <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Report</span></h1>
                    <p className="text-slate-400 text-lg max-w-3xl flex items-center gap-3">
                        <span className="font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 text-white shadow-sm">#{reportId.substring(0, 8)}</span>
                        <span>Staff assignment grouped by required departments.</span>
                    </p>
                    
                    {reportDepartments.length > 0 && (
                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold uppercase tracking-wider text-slate-500 mr-2">Required:</span>
                            {reportDepartments.map((dept, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-md text-xs font-bold tracking-wider uppercase">
                                    {dept}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {assignmentStatus && (
                    <div className={`mb-8 p-4 rounded-lg border font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                        assignmentStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                        <i className={`fas ${assignmentStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {assignmentStatus.message}
                    </div>
                )}
                
                {hasAnyStaff ? (
                    <div className="space-y-12">
                        {allDepartments.map((dept, index) => (
                            <section key={dept} className={`animate-in fade-in slide-in-from-bottom-6 duration-500 delay-${(index + 1) * 100}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                                        <i className="fas fa-sitemap text-xl"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{dept}</h2>
                                        <p className="text-sm text-slate-400">{staffsByDepartment[dept].length} eligible staff members</p>
                                    </div>
                                </div>
                                
                                {staffsByDepartment[dept].length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {staffsByDepartment[dept].map(staff => (
                                            <StaffItem 
                                                key={staff._id + dept} // Unique key for staff in a section
                                                staff={staff} 
                                                onCardClick={setSelectedStaff} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card p-8 text-center border-dashed border-slate-700/50 opacity-70">
                                        <i className="fas fa-users-slash text-3xl text-slate-600 mb-3 block"></i>
                                        <span className="text-slate-400">No staff currently eligible in this department.</span>
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-16 text-center border-dashed border-slate-700/50 flex flex-col items-center">
                        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                            <i className="fas fa-user-times text-5xl text-rose-500/70"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Eligible Staff Found</h3>
                        <p className="text-slate-400 max-w-md">There are currently no staff members available that match the required departments for this report.</p>
                    </div>
                )}
                
                {/* Staff Detail Modal */}
                {selectedStaff && (
                    <StaffDetailModal 
                        staff={selectedStaff}
                        currentReportId={reportId}
                        onClose={() => setSelectedStaff(null)}
                        onAssign={handleAssignStaff}
                        isAssignmentLoading={isAssignmentLoading}
                    />
                )}
                
                {isAssignmentLoading && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex flex-col items-center justify-center animate-in fade-in duration-200">
                        <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                        <h3 className="text-xl font-bold text-white tracking-wide">Assigning Report...</h3>
                        <p className="text-slate-400 mt-2">Please wait while we process the assignment.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StaffList;
