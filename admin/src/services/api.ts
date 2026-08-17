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

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
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
