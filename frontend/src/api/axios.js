import axios from "axios";

// Di production Vercel, selalu gunakan '/api' (path relatif).
// VITE_API_URL hanya digunakan untuk development lokal.
const baseURL = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL || "http://localhost:5000/api");

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: tambah Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("earsip_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("earsip_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
