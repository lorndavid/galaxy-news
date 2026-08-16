import { api, unwrap } from "./api";
import type { Advertisement, Category, NavigationItem, SiteSettings, Tag } from "@/types";

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
  homepageSections() {
    return unwrap<string[]>(api.get("/homepage/sections"));
  },
  navigation() {
    return unwrap<NavigationItem[]>(api.get("/navigation"));
  },
  submitContact(payload: { name: string; email: string; subject?: string; message: string }) {
    return unwrap<{ id: number }>(api.post("/contact", payload));
  },
  subscribeNewsletter(email: string) {
    return unwrap<{ id: number }>(api.post("/newsletter", { email }));
  },
};
