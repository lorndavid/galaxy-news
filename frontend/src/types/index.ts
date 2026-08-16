export type ArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR";
export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Author {
  id: number;
  name: string;
  email?: string;
  role?: UserRole;
  avatar: string | null;
  isActive?: boolean;
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
  author: Author;
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

export interface CategoryListResult {
  category: Category;
  items: Article[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SiteSettings {
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

export interface Comment {
  id: number;
  articleId: number;
  name: string;
  email?: string;
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
}

export interface ArticleListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  q?: string;
  featured?: string;
  breaking?: string;
  sort?: "latest" | "popular";
  authorId?: string;
}
