import axios from "axios";
import { clearAuthSession, getToken } from "../auth/session";

export const API_BASE_URL = "http://localhost:4000/api";
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
