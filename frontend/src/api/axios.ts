
import axios from "axios";
import { authService } from "../services/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5004/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
