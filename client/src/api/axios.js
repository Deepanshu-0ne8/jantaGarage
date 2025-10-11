import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: apiUrl, // full backend URL with port
  withCredentials: true, // include cookies for auth
});

export default api;
