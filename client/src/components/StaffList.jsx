import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getAllEligibleStaff } from '../services/reportService';
import Navbar from './navbar';
import './StaffList.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Utility function to get query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// --- Staff Detail Modal ---
const StaffDetailModal = ({ staff, onClose, onAssign, isAssignmentLoading }) => {
    
    // Non-sensitive fields displayed
    const relevantFields = [
        { label: "Role", value: staff.role.toUpperCase() },
        { label: "Email", value: staff.email },
        { label: "Contact", value: staff.contact || 'N/A' },
        { label: "Total Assigned Reports", value: staff.reportsAssignedCount }, // Use the calculated count
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
                    <div className="staff-detail-avatar">{staff.name ? staff.name[0].toUpperCase() : staff.userName[0].toUpperCase()}</div>
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
                    onClick={() => onAssign(staff)}
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
            <div className="staff-avatar-initial">{staff.name ? staff.name[0].toUpperCase() : staff.userName[0].toUpperCase()}</div>
            <div className="staff-details">
                <h3 className="staff-name">{staff.name || staff.userName}</h3>
                <p className="staff-email">{staff.email}</p>
            </div>
        </div>
        <div className staff-workload>
            <span className="workload-label">Active Assignments:</span>
            <span className="workload-count">{staff.reportsAssignedCount}</span>
        </div>
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

    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null); // New state for modal data
    const [reportDepartments, setReportDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
    const [assignmentStatus, setAssignmentStatus] = useState(null);

    const isAuthorized = user?.role === 'admin'; 

    // --- SORTING LOGIC ---
    const sortStaffsByWorkload = (staffs) => {
        // Sorts staff by the length of their reportsForVerification array (least assigned first)
        return staffs.sort((a, b) => {
            const countA = a.reportsForVerification?.length || 0;
            const countB = b.reportsForVerification?.length || 0;
            return countA - countB; // Ascending order (least reports first)
        }).map(s => ({
            ...s,
            // Attach the count for easy display in the UI components
            reportsAssignedCount: s.reportsForVerification?.length || 0
        }));
    };

    const fetchStaff = useCallback(async () => {
        if (!reportId || !isAuthorized) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const fetchedStaff = await getAllEligibleStaff(reportId);
            
            // Apply sorting by workload
            const sortedStaff = sortStaffsByWorkload(fetchedStaff);

            setStaffs(sortedStaff);
            
            if (sortedStaff.length > 0) {
                // Determine the unique departments for context display
                const allDepts = new Set(sortedStaff.flatMap(s => s.departments));
                setReportDepartments(Array.from(allDepts));
            }

        } catch (err) {
            setError(err.message);
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
    
    
    const handleAssignStaff = async (staff) => {
        // We call the server to assign the report. 
        // NOTE: A new API function (e.g., assignReport) is needed here.
        
        if (!window.confirm(`Confirm assigning report #${reportId.substring(0, 8)} to ${staff.name}?`)) {
            return;
        }
        
        setIsAssignmentLoading(true);
        setAssignmentStatus(null);
        
        try {
            // TODO: Implement actual assignment API call here
            // Example: await assignReport(reportId, staff._id); 
            
            console.log(`Report ${reportId} assigned to ${staff._id}.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API delay
            
            setAssignmentStatus({ type: 'success', message: `Successfully assigned report to ${staff.name}.` });
            setSelectedStaff(null); // Close modal
            
            // Redirect back to unassigned list after successful assignment
            setTimeout(() => navigate('/unAssignedReports'), 1500); 

        } catch (error) {
            setAssignmentStatus({ type: 'error', message: 'Assignment failed due to server error.' });
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

    return (
        <>
            <Navbar />
            <div className="staff-list-wrapper">
                <header className="staff-list-header">
                    <button className="back-button" onClick={() => navigate('/unAssignedReports')}>
                         <i className="fas fa-arrow-left"></i> Back to Queue
                    </button>
                    <h1>Assign Report #{reportId.substring(0, 8)}</h1>
                    <p className="report-context">Eligible staff for departments: **{reportDepartments.join(', ')}**</p>
                    <p className="sort-indicator">Sorted by: **Least Assigned Reports** (Best candidate first)</p>
                </header>

                {assignmentStatus && (
                    <div className={`status-alert alert-${assignmentStatus.type}`}>
                        {assignmentStatus.message}
                    </div>
                )}
                
                {staffs.length > 0 ? (
                    <div className="staff-grid">
                        {staffs.map(staff => (
                            <StaffItem 
                                key={staff._id} 
                                staff={staff} 
                                onCardClick={setSelectedStaff} // Open modal on card click
                            />
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
