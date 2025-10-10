import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getAllEligibleStaff } from '../services/reportService';
import { assignReportToStaff } from '../services/UserServices';
import Navbar from './navbar';
import './StaffList.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Utility function to get query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// --- Avatar Helper Component ---
const StaffAvatar = ({ staff, isDetail = false }) => {
    const sizeClass = isDetail ? 'detail-avatar' : 'initial-avatar';
    const initial = staff.name ? staff.name[0].toUpperCase() : staff.userName[0].toUpperCase();
    
    if (staff.displayPic?.url) {
        return <img src={staff.displayPic.url} alt={staff.name || staff.userName} className={`staff-avatar-img ${sizeClass}`} />;
    }
    
    return <div className={`staff-avatar-initial ${sizeClass}`}>{initial}</div>;
};


// --- Staff Detail Modal ---
const StaffDetailModal = ({ staff, onClose, onAssign, isAssignmentLoading, currentReportId }) => {
    
    // Workload field removed
    const relevantFields = [
        { label: "Role", value: staff.role.toUpperCase() },
        { label: "Email", value: staff.email },
        { label: "Contact", value: staff.contact || 'N/A' },
        { label: "Departments", value: staff.departments.join(', ') },
    ];
    
    return (
        <Modal
            isOpen={true}
            onRequestClose={onClose}
            className="staff-modal"
            overlayClassName="staff-overlay"
        >
            <div className="staff-detail-popup">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="staff-detail-header">
                    <StaffAvatar staff={staff} isDetail={true} />
                    <h2 className="staff-detail-name">{staff.name || staff.userName}</h2>
                </div>
                
                <div className="staff-detail-grid">
                    {relevantFields.map(field => (
                        <p key={field.label} className="detail-field">
                            <strong>{field.label}:</strong> {field.value}
                        </p>
                    ))}
                </div>

                <button 
                    className="assign-button modal-assign-button" 
                    onClick={() => onAssign(staff.id, currentReportId, staff.name)}
                    disabled={isAssignmentLoading}
                >
                    {isAssignmentLoading ? 'Assigning...' : `Assign Report Now`} 
                </button>
            </div>
        </Modal>
    );
};


// Component to display a single staff member card
const StaffItem = ({ staff, onCardClick }) => (
    <div className="staff-card" onClick={() => onCardClick(staff)}>
        <div className="staff-info">
            <StaffAvatar staff={staff} isDetail={false} />
            <div className="staff-details">
                <h3 className="staff-name">{staff.name || staff.userName}</h3>
                <p className="staff-email">{staff.email}</p>
            </div>
        </div>
        
        {/* Workload display removed */}

        <div className="staff-departments">
            {staff.departments.map(dept => (
                <span key={dept} className="dept-tag-mini">{dept.split(' ')[0]}</span>
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
            <>
                <Navbar />
                <div className="staff-list-container loading-state">
                    {loading ? 'Loading eligible staff...' : 'Authorizing access...'}
                </div>
            </>
        );
    }
    
    if (error) {
        return (
            <>
                <Navbar />
                <div className="staff-list-container error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </>
        );
    }

    const allDepartments = Object.keys(staffsByDepartment);
    const hasAnyStaff = allDepartments.some(dept => staffsByDepartment[dept].length > 0);

    return (
        <>
            <Navbar />
            <div className="staff-list-wrapper">
                <header className="staff-list-header">
                    <button className="back-button" onClick={() => navigate('/unAssignedReports')}>
                         <i className="fas fa-arrow-left"></i> Back to Queue</button>
                    <h1>Assign Report #{reportId.substring(0, 8)}</h1>
                    <p className="report-context">
                        Staff assignment grouped by the **{reportDepartments.length}** required departments: 
                        <span className="required-depts-list">{reportDepartments.join(', ')}</span>
                    </p>
                </header>

                {assignmentStatus && (
                    <div className={`status-alert alert-${assignmentStatus.type}`}>
                        {assignmentStatus.message}
                    </div>
                )}
                
                {hasAnyStaff ? (
                    <div className="department-groups-container">
                        {allDepartments.map(dept => (
                            <section key={dept} className="department-section">
                                <h2 className="department-title">
                                    <i className="fas fa-sitemap"></i> {dept}
                                    <span className="staff-count-badge">{staffsByDepartment[dept].length} Staff</span>
                                </h2>
                                
                                {staffsByDepartment[dept].length > 0 ? (
                                    <div className="staff-grid">
                                        {staffsByDepartment[dept].map(staff => (
                                            <StaffItem 
                                                key={staff._id + dept} // Unique key for staff in a section
                                                staff={staff} 
                                                onCardClick={setSelectedStaff} 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-staff-in-dept">No staff currently eligible in this department.</div>
                                )}
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="no-staff-message">
                        <i className="fas fa-user-times"></i>
                        <p>No eligible staff found for the required departments.</p>
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
                
                {isAssignmentLoading && <div className="loading-overlay">Assigning...</div>}
            </div>
        </>
    );
};

export default StaffList;
