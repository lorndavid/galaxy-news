import axios from "axios";
import type { ApiResponse } from "@/types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ??
      (error?.code === "ECONNABORTED"
        ? "សំណើរបស់អ្នកបានផុតកំណត់ពេលវេលា"
        : "មានបញ្ហាតភ្ជាប់បណ្តាញ");
    return Promise.reject(new Error(message));
  }
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}
