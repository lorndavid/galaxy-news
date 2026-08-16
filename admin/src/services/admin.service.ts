import { api, unwrap } from "./api";
import type {
  ActivityLog,
  Advertisement,
  Article,
  Category,
  Comment,
  ContactMessage,
  DashboardStats,
  Media,
  NewsletterSubscriber,
  Paginated,
  SiteSettings,
  Tag,
  User,
} from "@/types";

export const adminService = {
  // System
  stats() {
    return unwrap<DashboardStats>(api.get("/admin/stats"));
  },
  activity(page = 1, pageSize = 20) {
    return unwrap<Paginated<ActivityLog>>(
      api.get("/admin/activity", { params: { page, pageSize } })
    );
  },
  settings() {
    return unwrap<SiteSettings>(api.get("/admin/settings"));
  },
  updateSettings(payload: Partial<SiteSettings>) {
    return unwrap<SiteSettings>(api.put("/admin/settings", payload));
  },

  // Articles
  articles(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<Article>>(api.get("/admin/articles", { params }));
  },
  article(id: number) {
    return unwrap<Article>(api.get(`/admin/articles/${id}`));
  },
  createArticle(payload: Record<string, unknown>) {
    return unwrap<Article>(api.post("/admin/articles", payload));
  },
  updateArticle(id: number, payload: Record<string, unknown>) {
    return unwrap<Article>(api.patch(`/admin/articles/${id}`, payload));
  },
  deleteArticle(id: number) {
    return api.delete(`/admin/articles/${id}`);
  },

  // Categories
  categories() {
    return unwrap<Category[]>(api.get("/admin/categories"));
  },
  createCategory(payload: Record<string, unknown>) {
    return unwrap<Category>(api.post("/admin/categories", payload));
  },
  updateCategory(id: number, payload: Record<string, unknown>) {
    return unwrap<Category>(api.patch(`/admin/categories/${id}`, payload));
  },
  deleteCategory(id: number) {
    return api.delete(`/admin/categories/${id}`);
  },
  reorderCategories(ids: number[]) {
    return unwrap<{ ok: boolean }>(api.post("/admin/categories/reorder", { ids }));
  },

  // Tags
  tags() {
    return unwrap<Tag[]>(api.get("/admin/tags"));
  },
  createTag(payload: Record<string, unknown>) {
    return unwrap<Tag>(api.post("/admin/tags", payload));
  },
  updateTag(id: number, payload: Record<string, unknown>) {
    return unwrap<Tag>(api.patch(`/admin/tags/${id}`, payload));
  },
  deleteTag(id: number) {
    return api.delete(`/admin/tags/${id}`);
  },

  // Media
  media(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<Media>>(api.get("/admin/media", { params }));
  },
  deleteMedia(id: number) {
    return api.delete(`/admin/media/${id}`);
  },

  // Users
  users(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<User>>(api.get("/admin/users", { params }));
  },
  createUser(payload: Record<string, unknown>) {
    return unwrap<User>(api.post("/admin/users", payload));
  },
  updateUser(id: number, payload: Record<string, unknown>) {
    return unwrap<User>(api.patch(`/admin/users/${id}`, payload));
  },
  deleteUser(id: number) {
    return api.delete(`/admin/users/${id}`);
  },

  // Comments
  comments(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<Comment>>(api.get("/admin/comments", { params }));
  },
  moderateComment(id: number, status: string) {
    return unwrap<Comment>(api.patch(`/admin/comments/${id}`, { status }));
  },
  deleteComment(id: number) {
    return api.delete(`/admin/comments/${id}`);
  },

  // Messages
  messages(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<ContactMessage>>(api.get("/admin/messages", { params }));
  },
  deleteMessage(id: number) {
    return api.delete(`/admin/messages/${id}`);
  },

  // Newsletter
  newsletter(params: Record<string, unknown> = {}) {
    return unwrap<Paginated<NewsletterSubscriber>>(api.get("/admin/newsletter", { params }));
  },
  deleteSubscriber(id: number) {
    return api.delete(`/admin/newsletter/${id}`);
  },

  // Ads
  ads() {
    return unwrap<Advertisement[]>(api.get("/admin/ads"));
  },
  createAd(payload: Record<string, unknown>) {
    return unwrap<Advertisement>(api.post("/admin/ads", payload));
  },
  updateAd(id: number, payload: Record<string, unknown>) {
    return unwrap<Advertisement>(api.patch(`/admin/ads/${id}`, payload));
  },
  deleteAd(id: number) {
    return api.delete(`/admin/ads/${id}`);
  },
};
