import axios from "axios";
import type { ApiResponse } from "@/types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";
export const TOKEN_KEY = "navatra_admin_token";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh interceptor: when a 401 occurs, attempt to refresh the
// access token using the httpOnly refresh cookie before giving up.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // If 401 and not already retrying and not the login/refresh endpoints
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint — the httpOnly cookie is sent automatically
        const { data: refreshRes } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes?.data?.accessToken;
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        throw new Error("No token in refresh response");
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — redirect to login
        localStorage.removeItem(TOKEN_KEY);
        if (window.location.pathname !== "/login") {
          const msg = document.createElement("div");
          msg.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/60";
          msg.innerHTML = '<div class="rounded-xl bg-white p-6 text-center shadow-xl max-w-sm mx-4"><p class="text-sm font-medium text-slate-800">សម័យអ្នកប្រើប្រាស់បានផុតកំណត់</p><p class="mt-1 text-xs text-slate-500">សូមចូលប្រព័ន្ធឡើងវិញ</p></div>';
          document.body.appendChild(msg);
          setTimeout(() => { window.location.href = "/login"; }, 1200);
        }
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error?.response?.data?.message ?? "សំណើបរាជ័យ សូមព្យាយាមម្តងទៀត";
    return Promise.reject(new Error(message));
  }
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export async function uploadFile(
  file: File,
  extra: { altText?: string; folder?: string; caption?: string } = {}
): Promise<{ data: { data: import("@/types").Media } }> {
  const form = new FormData();
  form.append("file", file);
  if (extra.altText) form.append("altText", extra.altText);
  if (extra.folder) form.append("folder", extra.folder);
  if (extra.caption) form.append("caption", extra.caption);
  return api.post("/admin/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
