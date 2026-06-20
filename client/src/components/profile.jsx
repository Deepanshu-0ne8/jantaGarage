import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { updateProfileApi, removeDpApi } from '../services/UserServices'; // FIX: Changed from UserServices to UserService
import Navbar from './navbar'; 

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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border-slate-700/60 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-700/50 bg-slate-900/50">
                  <h3 className="text-xl font-bold text-white">Select Assigned Departments</h3>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DEPARTMENT_OPTIONS.map(dept => (
                          <label key={dept} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.includes(dept) ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'}`}>
                              <input
                                  type="checkbox"
                                  id={dept}
                                  value={dept}
                                  checked={selected.includes(dept)}
                                  onChange={handleCheckboxChange}
                                  className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 focus:ring-offset-slate-900"
                              />
                              <span className={`text-sm ${selected.includes(dept) ? 'text-white font-medium' : 'text-slate-400'}`}>{dept}</span>
                          </label>
                      ))}
                  </div>
                </div>
                <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 flex justify-end gap-3">
                    <button type="button" className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-semibold" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all text-sm" onClick={handleSave}>
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
    <form className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit}>
      
      {/* Profile Picture */}
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
        <label className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4">Update Profile Picture</label>
        <div 
          className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group border-4 border-slate-700/50 hover:border-blue-500/50 transition-colors shadow-lg" 
          onClick={() => fileInputRef.current.click()}
        >
          <img
            src={formData.displayPic ? URL.createObjectURL(formData.displayPic) : dpUrl}
            alt="Current DP"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold text-center px-2">
              {formData.displayPic ? 'Change Photo' : 'Upload Photo'}
            </span>
          </div>
          <input
            type="file"
            name="displayPic"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {formData.displayPic && <p className="mt-3 text-sm text-emerald-400 font-medium truncate max-w-[200px]">{formData.displayPic.name}</p>}
      </div>

      {/* Basic Details */}
      <section className="glass-card p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <i className="fas fa-user-edit text-blue-400"></i> Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-400" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-400" htmlFor="contact">Contact Number</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={String(formData.contact || '')}
              onChange={handleInputChange}
              placeholder="Enter 10-digit number"
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-400" htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-500">Username</label>
            <input 
              type="text" 
              value={user.userName} 
              disabled 
              className="px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-500 cursor-not-allowed" 
            />
          </div>
        </div>
      </section>

      {/* Departments (Staff/Admin) */}
      {isStaffOrAdmin && (
        <section className="glass-card p-6 md:p-8 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <i className="fas fa-building text-emerald-400"></i> Assigned Departments
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-700/50 rounded-lg p-5">
            <div>
              <p className="text-sm font-medium text-white mb-1">
                {formData.departments?.length || 0} Departments Selected
              </p>
              <p className="text-xs text-slate-400">
                  {formData.departments && formData.departments.length > 0 ? 
                      `${formData.departments.slice(0, 2).join(', ')}${formData.departments.length > 2 ? '...' : ''}` : 
                      "Click manage to select departments."}
              </p>
            </div>
            
            <button
              type="button"
              className="px-4 py-2 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              onClick={handleDepartmentSelectClick}
            >
              Manage Departments
            </button>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-4">
        <button
          type="button"
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-semibold"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          disabled={status.type === 'loading'}
        >
          {status.type === 'loading' ? (
             <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</>
          ) : 'Save Changes'}
        </button>
      </div>
    </form>
  );
});

// --- Main Profile Component ---
const Profile = () => {
  
  const { user, loading, logout, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Navbar />
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Navbar />
      <div className="flex justify-center items-center h-[80vh]">
        <div className="glass-card p-8 text-center text-rose-400 font-bold border-rose-500/30">
          <i className="fas fa-lock text-3xl mb-3 block"></i>
          Access Denied: Please log in.
        </div>
      </div>
    </div>
  );

  const dpUrl = user.displaypic?.url || 'https://via.placeholder.com/150?text=👤';
  const isDefaultDp = user.displaypic?.url?.includes('DEFAULT_DP_URL_FRAGMENT');
  const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';
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

    if (formData.name !== user.name) { dataToSend.append('name', formData.name); changesDetected = true; }
    
    if (String(formData.contact) !== String(user.contact)) { dataToSend.append('contact', formData.contact); changesDetected = true; }
    if (formData.address !== user.address) { dataToSend.append('address', formData.address); changesDetected = true; }

    if (isStaffOrAdmin) {
      const currentDepartments = user.departments || [];
      const newDepartments = formData.departments || [];
      
      if (JSON.stringify(newDepartments.sort()) !== JSON.stringify(currentDepartments.sort())) {
        
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
    <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/50">
      <span className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">{label}</span>
      <span className="block text-sm font-medium text-white">{value || <span className="text-slate-600 italic">Not provided</span>}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <Navbar /> 

      <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Your Profile</h1>
          <p className="text-slate-400 text-sm">Manage your personal information and account settings.</p>
        </div>

        {status.message && (
          <div className={`p-4 rounded-lg mb-8 border animate-in fade-in slide-in-from-top-2 flex items-center gap-3 ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              status.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
              status.type === 'loading' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              'bg-slate-800/50 border-slate-700 text-slate-300'
          }`}>
            {status.type === 'loading' && <i className="fas fa-spinner fa-spin"></i>}
            {status.type === 'success' && <i className="fas fa-check-circle"></i>}
            {status.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
            <span className="font-medium text-sm">{status.message}</span>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 flex-shrink-0">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-emerald-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 bg-slate-800 relative group">
                    <img src={dpUrl} alt="Avatar" className="w-full h-full object-cover" />
                    {!isDefaultDp && (
                      <button 
                        className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveDp}
                        title="Remove Picture"
                      >
                        <i className="fas fa-trash-alt text-white text-xl"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center md:text-left flex-grow">
                <h2 className="text-3xl font-extrabold text-white mb-2">{user.name || user.userName}</h2>
                <p className="text-slate-400 text-sm mb-4 flex items-center justify-center md:justify-start gap-2">
                  <i className="fas fa-envelope text-slate-500"></i> {user.email}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    user.role === 'staff' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {user.role}
                  </span>
                  {user.isVerified && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                      <i className="fas fa-check-circle"></i> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0 flex flex-col md:flex-row gap-3">
                 <button 
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    onClick={handleEditClick}
                  >
                    <i className="fas fa-pen text-blue-400"></i> Edit Profile
                 </button>
                 <button 
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt"></i> Logout
                 </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="glass-card p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700/50 pb-3 flex items-center gap-2">
                  <i className="fas fa-address-card text-blue-400"></i> Details
                </h3>
                <div className="space-y-4">
                  <ProfileField label="Username" value={user.userName} />
                  <ProfileField label="Contact Number" value={user.contact} />
                  <ProfileField label="Address" value={user.address} />
                  <ProfileField label="Member Since" value={memberSince} />
                </div>
              </section>

              {isStaffOrAdmin && (
                <section className="glass-card p-6 md:p-8 border-emerald-500/20">
                  <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700/50 pb-3 flex items-center gap-2">
                    <i className="fas fa-building text-emerald-400"></i> Assigned Departments
                  </h3>
                  {user.departments && user.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.departments.map((dept, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
                          {dept}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 text-center text-slate-500 text-sm italic">
                      No departments assigned yet.
                    </div>
                  )}
                </section>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
