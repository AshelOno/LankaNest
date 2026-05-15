import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
  (import.meta.env.MODE === "development" ? "http://localhost:5000" : "");
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL || window.location.origin;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong. Please try again.";
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export function getApiUrl(path = "") {
  return `${API_BASE_URL}${path}`;
}
