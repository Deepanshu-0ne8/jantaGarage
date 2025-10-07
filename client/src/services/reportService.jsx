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