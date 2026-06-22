import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

let currentAccessToken = null;

export const setAccessToken = (token) => {
    currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

api.interceptors.request.use((config) => {
    if (currentAccessToken) {
        config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/signin') {
            originalRequest._retry = true;
            try {
                const res = await axios.post(`${apiUrl}/auth/refresh`, {}, { withCredentials: true });
                if (res.data.success) {
                    const token = res.data.data.accessToken;
                    setAccessToken(token);
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    
                    // Dispatch a custom event so React context can sync the state if needed
                    window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: token }));
                    
                    return api(originalRequest);
                }
            } catch (refreshError) {
                setAccessToken(null);
                window.dispatchEvent(new Event('authFailed'));
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
