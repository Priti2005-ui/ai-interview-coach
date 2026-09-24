import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    if (error?.response?.status === 401) {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");

      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
    }

    error.customMessage = message;
    return Promise.reject(error);
  }
);

export default apiClient;