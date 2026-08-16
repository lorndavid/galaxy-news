export type ArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";
export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  authorId: number;
  categoryId: number;
  status: ArticleStatus;
  isFeatured: boolean;
  isBreaking: boolean;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: number; name: string; avatar: string | null; role: UserRole };
  category: Category;
  tags: Tag[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Media {
  id: number;
  publicId: string | null;
  url: string;
  secureUrl: string;
  fileName: string;
  width: number | null;
  height: number | null;
  format: string | null;
  size: number | null;
  altText: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface Comment {
  id: number;
  articleId: number;
  article?: { id: number; title: string };
  name: string;
  email: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
}

export interface Advertisement {
  id: number;
  name: string;
  image: string;
  link: string | null;
  position: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  entity: string | null;
  entityId: number | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  user: { id: number; name: string } | null;
}

export interface DashboardStats {
  counts: {
    totalArticles: number;
    published: number;
    drafts: number;
    scheduled: number;
    archived: number;
    categories: number;
    tags: number;
    users: number;
    authors: number;
    commentsPending: number;
    adsActive: number;
    newsletter: number;
    totalViews: number;
  };
  recentActivity: ActivityLog[];
  recentArticles: { id: number; title: string; status: ArticleStatus; updatedAt: string; author: { name: string } }[];
  topArticles: { id: number; title: string; views: number }[];
}

export interface SiteSettings {
  id: number;
  siteName: string;
  logo: string | null;
  favicon: string | null;
  description: string | null;
  facebook: string | null;
  telegram: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  twitter: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}
