// src/libs/axios.ts
import axios from "axios";
import { waitForToken } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000",
});

// Interceptor de request: espera token y lo inyecta
api.interceptors.request.use(
  async (config) => {
    const token = await waitForToken(); // <- NO sigue sin token
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// (opcional) Manejo 401: aquí podrías limpiar sesión, redirigir, etc.
// api.interceptors.response.use(undefined, async (error) => { ... });

export default api;
