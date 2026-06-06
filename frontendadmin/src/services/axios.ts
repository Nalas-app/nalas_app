import axios from "axios";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "../utils/errorHandler";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops for the refresh endpoint itself
    if (originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

      if (!refreshToken) {
        // If no refresh token, force logout
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          window.location.href = "/";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken,
        });

        // Backend response format: { success: true, data: { accessToken, refreshToken } }
        const newAccessToken = data.data?.accessToken || data.data?.token;
        const newRefreshToken = data.data?.refreshToken;

        if (typeof window !== "undefined" && newAccessToken) {
          localStorage.setItem("token", newAccessToken);
          const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
          document.cookie = `token=${encodeURIComponent(newAccessToken)}; expires=${expires}; path=/`;

          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
          
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          window.location.href = "/";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response && error.response.status === 403) {
      if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          window.location.href = "/";
      }
    }

    // Display error notification globally, except for 401s (handled by refresh logic) and refresh failures
    if (error.response?.status !== 401 && originalRequest?.url !== '/auth/refresh') {
      if (typeof window !== "undefined") {
        toast.error(getErrorMessage(error));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
