// src/libs/axiosInstance.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, // cámbialo por tu endpoint base
});

// Interceptor para añadir el token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
