import { api, unwrap } from "./api";
import type { Advertisement, Category, SiteSettings, Tag } from "@/types";

export const contentService = {
  settings() {
    return unwrap<SiteSettings>(api.get("/settings"));
  },
  categories() {
    return unwrap<Category[]>(api.get("/categories"));
  },
  tags() {
    return unwrap<Tag[]>(api.get("/tags"));
  },
  ads(position: string) {
    return unwrap<Advertisement[]>(api.get(`/ads/${position}`));
  },
  submitContact(payload: { name: string; email: string; subject?: string; message: string }) {
    return unwrap<{ id: number }>(api.post("/contact", payload));
  },
  subscribeNewsletter(email: string) {
    return unwrap<{ id: number }>(api.post("/newsletter", { email }));
  },
};
