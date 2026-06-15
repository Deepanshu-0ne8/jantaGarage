// src/services/UserServices.js
import api from "../api/axios";

/**
 * PATCH /api/v1/user → update profile
 */
export const updateProfileApi = async (formData) => {
  const response = await api.patch('/user/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data?.data;
};

export const removeDpApi = async () => {
  const response = await api.delete('/user/');
  return response.data?.data;
};

export const getAssignedReportsForStaff = async () => {
    try {
        const response = await api.get('/user/assignedReports', {});
        
        return response.data.data;
        
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch assigned reports.";
        throw new Error(errorMessage);
    }
};

export const assignReportToStaff = async (staffId, reportId) => {
    try {
        
        const response = await api.patch('/user/assignReport', {
            reportId: reportId,
            staffId: staffId
        });
       
        return response.data;

    } catch (error) {
        const errorMessage = error.response?.data?.message || "Assignment failed.";
        throw new Error(errorMessage);
    }
};

export const getNotifications = async () => {
  const res = await api.get("/user/notifications", { withCredentials: true });
  // backend returns: { success: true, data: req.user.notifications }
  return res.data.data || [];
};
export const removeNotification = async (notificationId) => {
  const res = await api.patch(`/user/remove/${notificationId}`, {}, { withCredentials: true });
  return res.data.data || []; // updated notifications array
};

export const clearAllNotifications = async () => {
  const res = await api.patch("/user/removeAll", {}, { withCredentials: true });
  return res.data.data || [];
};