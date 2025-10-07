import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { updateProfileApi, removeDpApi } from '../services/UserServices'; // FIX: Changed from UserServices to UserService
import './profile.css';
import Navbar from './navbar'; 

// 1. Department List (Hardcoded from your backend model)
const DEPARTMENT_OPTIONS = [
    "Water Supply & Sewage Department", "Public Health & Sanitation Department",
    "Roads & Infrastructure Department", "Street Lighting Department",
    "Parks & Horticulture Department", "Building & Construction Department",
    "Drainage Department", "Electricity Department",
    "Public Works Department", "Traffic & Transportation Department",
    "Solid Waste Management Department", "Animal Control Department",
    "Health & Hospital Services", "Fire & Emergency Services",
    "Environmental Department", "Revenue Department",
    "Urban Planning & Development Authority", "Public Grievance & Complaint Cell",
];

// --- Department Modal Component ---
const DepartmentModal = ({ currentDepartments, onSave, onClose }) => {
    const [selected, setSelected] = useState(currentDepartments);

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setSelected(prev => 
            checked
                ? [...prev, value]
                : prev.filter(dept => dept !== value)
        );
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="department-modal">
                <h3>Select Assigned Departments</h3>
                <div className="checkbox-grid">
                    {DEPARTMENT_OPTIONS.map(dept => (
                        <div key={dept} className="checkbox-item">
                            <input
                                type="checkbox"
                                id={dept}
                                value={dept}
                                checked={selected.includes(dept)}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor={dept}>{dept}</label>
                        </div>
                    ))}
                </div>
                <div className="modal-actions">
                    <button type="button" className="action-btn secondary-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="action-btn primary-btn" onClick={handleSave}>
                        Apply Selection ({selected.length})
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Memoized Edit Form ---
const EditForm = memo(({
  formData,
  handleInputChange,
  handleSubmit,
  dpUrl,
  fileInputRef,
  handleFileChange,
  user,
  status,
  setIsEditing,
  handleDepartmentSelectClick, 
}) => {
  const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      {/* Profile Picture */}
      <div className="form-group avatar-edit-group">
        <label className="data-label">Update Picture</label>
        <div className="dp-upload-area" onClick={() => fileInputRef.current.click()}>
          <img
            src={formData.displayPic ? URL.createObjectURL(formData.displayPic) : dpUrl}
            alt="Current DP"
            className="edit-avatar-preview"
          />
          <input
            type="file"
            name="displayPic"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-overlay">
            {formData.displayPic ? 'File Selected' : 'Choose New Photo'}
          </div>
        </div>
        {formData.displayPic && <p className="file-name">{formData.displayPic.name}</p>}
      </div>

      {/* Basic Details */}
      <section className="profile-details-card">
        <h2>Edit Personal Information</h2>
        <div className="data-grid">
          <div className="form-group">
            <label className="data-label" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="data-label" htmlFor="contact">Contact Number</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={String(formData.contact || '')}
              onChange={handleInputChange}
              placeholder="Enter 10-digit number"
            />
          </div>
          <div className="form-group">
            <label className="data-label" htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="data-label">Username</label>
            <input type="text" value={user.userName} disabled className="disabled-input" />
          </div>
        </div>
      </section>

      {/* Departments (Staff/Admin) */}
      {isStaffOrAdmin && (
        <section className="departments-card">
          <h2>Assigned Departments</h2>
          <div className="form-group">
            <label className="data-label">Departments ({formData.departments?.length || 0} selected)</label>
            
            <button
              type="button"
              className="action-btn select-dept-btn"
              onClick={handleDepartmentSelectClick}
            >
              Manage Departments
            </button>
            
            <p className="info-text">
                {formData.departments && formData.departments.length > 0 ? 
                    `Selected: ${formData.departments.slice(0, 2).join(', ')}...` : 
                    "Click to select one or more departments."}
            </p>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="profile-actions form-actions">
        <button
          type="submit"
          className="action-btn primary-btn"
          disabled={status.type === 'loading'}
        >
          {status.type === 'loading' ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          className="action-btn secondary-btn"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
});

// --- Main Profile Component ---
const Profile = () => {
  // NOTE: Switched to 'UserService' assumption for API functions
  const { user, loading, logout, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  // Auto-clear status after 4 seconds
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  if (loading) return (
    <>
      <Navbar />
      <div className="profile-container loading-state">Loading profile data...</div>
    </>
  );
  if (!user) return (
    <>
      <Navbar />
      <div className="profile-container error-state">Access Denied: Please log in.</div>
    </>
  );

  const dpUrl = user.displaypic?.url || 'https://via.placeholder.com/150?text=👤';
  const isDefaultDp = user.displaypic?.url?.includes('DEFAULT_DP_URL_FRAGMENT');
  const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';
  const hasDepartments = isStaffOrAdmin && user.departments && user.departments.length > 0;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, displayPic: e.target.files[0] }));
  }, []);

  const handleDepartmentSelectClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleSaveDepartments = useCallback((selectedDepartments) => {
    setFormData(prev => ({ ...prev, departments: selectedDepartments }));
  }, []);

  const handleEditClick = () => {
    setFormData({
      name: user.name || '',
      contact: user.contact ? String(user.contact) : '',
      address: user.address || '',
      departments: user.departments || [],
      displayPic: null,
    });
    setIsEditing(true);
    setStatus({ type: '', message: '' });
  };

  const handleRemoveDp = async () => {
    if (isDefaultDp || !window.confirm("Remove your profile picture?")) return;
    try {
      const updatedUser = await removeDpApi();
      setUser(updatedUser);
      setStatus({ type: 'success', message: 'Profile picture removed successfully!' });
    } catch (error) {
      console.error("Remove DP Error:", error);
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to remove DP.' });
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Updating profile...' });

    const dataToSend = new FormData();
    let changesDetected = false;

    // Change Detection (General fields)
    if (formData.name !== user.name) { dataToSend.append('name', formData.name); changesDetected = true; }
    // CRITICAL: Ensure contact is treated as a string when appending to FormData
    if (String(formData.contact) !== String(user.contact)) { dataToSend.append('contact', formData.contact); changesDetected = true; }
    if (formData.address !== user.address) { dataToSend.append('address', formData.address); changesDetected = true; }

    // Change Detection (Departments)
    if (isStaffOrAdmin) {
      const currentDepartments = user.departments || [];
      const newDepartments = formData.departments || [];
      
      if (JSON.stringify(newDepartments.sort()) !== JSON.stringify(currentDepartments.sort())) {
        // Append departments array: FormData handles arrays by appending multiple times
        newDepartments.forEach(dept => {
             dataToSend.append('departments', dept);
        });
        changesDetected = true;
      }
    }

    if (formData.displayPic) {
      dataToSend.append('displayPic', formData.displayPic);
      changesDetected = true;
    }

    if (!changesDetected) {
      setStatus({ type: 'info', message: 'No changes detected.' });
      setIsEditing(false);
      return;
    }

    try {
      const updatedUser = await updateProfileApi(dataToSend);
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      setUser(updatedUser); 
      setIsEditing(false);
      
    } catch (error) {
      console.error("Update Profile Error:", error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Update failed. Check contact number/input formats.'
      });
    }
  }, [formData, user, isStaffOrAdmin, setUser, setIsEditing]);

  const ProfileField = ({ label, value }) => (
    <div className="data-item">
      <span className="data-label">{label}</span>
      <span className="data-value">{value || 'Not provided'}</span>
    </div>
  );

  return (
    <>
      <Navbar /> 
      <div className="profile-page-wrapper">
        <div className={`profile-container role-${user.role}`}>
          {status.message && (
            <div className={`status-message status-${status.type}`}>
              {status.message}
            </div>
          )}

          {isEditing ? (
            <>
              <EditForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                dpUrl={dpUrl}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                user={user}
                status={status}
                setIsEditing={setIsEditing}
                handleDepartmentSelectClick={handleDepartmentSelectClick}
              />
              {isModalOpen && isStaffOrAdmin && (
                  <DepartmentModal
                      currentDepartments={formData.departments || []}
                      onSave={handleSaveDepartments}
                      onClose={() => setIsModalOpen(false)}
                  />
              )}
            </>
          ) : (
            <>
              <div className="profile-header">
                <div className="avatar-section">
                  <img src={dpUrl} alt="Avatar" className="profile-avatar" />
                  {!isDefaultDp && (
                    <button className="remove-dp-btn" onClick={handleRemoveDp}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>

                <div className="user-identity">
                  <h1>{user.name || user.userName}</h1>
                  <p className="user-email">{user.email}</p>
                  <div className="role-and-status">
                    <span className={`user-role-badge role-${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                    {user.isVerified && <span className="verified-tag">Verified</span>}
                  </div>
                </div>
              </div>

              <section className="profile-details-card">
                <h2>Personal Information</h2>
                <div className="data-grid">
                  <ProfileField label="Username" value={user.userName} />
                  <ProfileField label="Contact Number" value={user.contact} />
                  <ProfileField label="Address" value={user.address} />
                  <ProfileField label="Joined" value={memberSince} />
                </div>
              </section>

              {isStaffOrAdmin && (
                <section className="departments-card">
                  <h2>Assigned Departments</h2>
                  {user.departments && user.departments.length > 0 ? (
                    <div className="department-tags-container">
                      {user.departments.map((dept, idx) => (
                        <span key={idx} className="department-tag">{dept}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="info-text">No departments assigned yet.</p>
                  )}
                </section>
              )}

              <div className="profile-actions">
                <button className="action-btn primary-btn" onClick={handleEditClick}>
                  Edit Profile
                </button>
                <button className="action-btn secondary-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
