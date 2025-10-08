import api from "../api/axios"; // Assuming this is your configured axios instance

/**
 * Fetches departmental reports for the authenticated staff/admin user.
 * Assumes the user role check and authorization is handled by the backend.
 * @returns {Promise<Array<Object>>} A list of reports relevant to the user's departments.
 */
export const getDepartmentalReports = async () => {
    try {
        // The backend route is defined as: app.use('/api/v1/user', userRouter)
        // and userRouter.get('/departmentalReport', ...)
        const response = await api.get('/user/departmentalReport');
        
        // Backend returns: { success: true, data: reports }
        return response.data.data;
        
    } catch (error) {
        // If status is 403 (unauthorized) or 404 (no reports found), throw the specific message
        const errorMessage = error.response?.data?.message || "Failed to fetch reports.";
        throw new Error(errorMessage);
    }
};

export const updateStatusToInProgress = async (reportId) => {
    try {
        // Your backend uses PUT /reports/verify/:id
        const response = await api.put(`/reports/verify/${reportId}`);
        // Backend returns: { success: true, message: "Report verified successfully.", data: report }
        return response.data.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to update status to In Progress.";
        throw new Error(errorMessage);
    }
};


export const updateStatusToResolvedNotification = async (reportId) => {
    try {
        // Your backend uses PUT /reports/resolve/:id
        const response = await api.put(`/reports/resolve/${reportId}`);
        // Backend returns: { success: true, message: "Notification sent..." }
        return response.data.message; 
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to send resolution notification.";
        throw new Error(errorMessage);
    }
};

export const getReportsForVerification = async () => {
    try {
        const response = await api.get('/user/reportForVerification');
        // Backend returns: { success: true, data: reports }
        return response.data.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch reports for verification.";
        throw new Error(errorMessage);
    }
};


export const getUnassignedReports = async () => {
    try {
        const response = await api.get('/reports/unAssigned');
        
        // Backend returns: { status: "success", data: reports }
        return response.data.data;
        
    } catch (error) {
        // Catches 403 (Unauthorized - non-admin) or 404/500 errors
        const errorMessage = error.response?.data?.message || "Failed to fetch unassigned reports.";
        throw new Error(errorMessage);
    }
};


export const getAllEligibleStaff = async (reportId) => {
    try {
        const response = await api.get(`/reports/getAllStaff/${reportId}`);
        return response.data.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch staff list.";
        throw new Error(errorMessage);
    }
};