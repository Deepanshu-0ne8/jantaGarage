import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:6785/api/v1", // full backend URL with port
  withCredentials: true, // include cookies for auth
});

export default api;
