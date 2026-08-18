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
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
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
  nameEn: string | null;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  excerpt: string | null;
  excerptEn: string | null;
  content: string;
  contentEn: string | null;
  featuredImage: string | null;
  authorId: number;
  categoryId: number;
  status: ArticleStatus;
  isFeatured: boolean;
  isBreaking: boolean;
  views: number;
  galleryColumns: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: number; name: string; avatar: string | null; role: UserRole };
  category: Category;
  tags: Tag[];
  telegramPublications?: TelegramPublication[];
}

export interface ArticleImage {
  id: number;
  mediaId: number;
  url: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
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
  objectKey: string | null;
  url: string;
  secureUrl: string;
  fileName: string;
  width: number | null;
  height: number | null;
  format: string | null;
  size: number | null;
  altText: string | null;
  caption: string | null;
  folder: string;
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
  title: string | null;
  image: string;
  link: string | null;
  target: string;
  position: string;
  device: string;
  priority: number;
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
  categoryBreakdown: {
    total: number;
    items: { id: number; name: string; nameEn: string | null; slug: string; color: string | null; count: number }[];
  };
  viewsByDay: { date: string; count: number }[];
}

export interface SiteSettings {
  id: number;
  siteName: string;
  siteNameEn: string | null;
  logo: string | null;
  favicon: string | null;
  description: string | null;
  descriptionEn: string | null;
  defaultLanguage: "kh" | "en";

  // Live news ticker
  tickerEnabled: boolean;
  tickerTitle: string;
  tickerSpeed: "slow" | "medium" | "fast";
  tickerDirection: "left" | "right";
  tickerCount: number;
  tickerRefresh: number;
  tickerBgColor: string;
  tickerTextColor: string;
  tickerAccentColor: string;
  facebook: string | null;
  telegram: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  twitter: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;

  // Theme tokens
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;

  // Layout/zone colors (navbar, page background, footer)
  bodyBgColor: string;
  headerBgColor: string;
  headerTextColor: string;
  footerBgColor: string;
  footerTextColor: string;

  // Layout style (container width)
  layoutStyle: "boxed" | "wide" | "fluid";

  // Social share link templates ({url}/{title} placeholders)
  shareFacebook: string;
  shareTikTok: string;
  shareTelegram: string;
  shareWhatsapp: string;

  fontHeading: string;
  fontBody: string;
  fontArticle: string;
  fontSizeHero: number;
  fontSizeSection: number;
  fontSizeCard: number;
  fontSizeBody: number;
  radiusPreset: "sharp" | "minimal" | "medium" | "rounded";
  shadowPreset: "none" | "subtle" | "medium" | "strong";
}

export type TelegramLanguageMode = "both" | "kh" | "en";

export type TelegramDestinationType = "private" | "group" | "supergroup" | "channel";

export interface TelegramDestination {
  id: string;
  chatId: string;
  type: TelegramDestinationType;
  label: string;
  enabled: boolean;
}

export interface TelegramDestinationInput {
  id?: string;
  chatId: string;
  type?: TelegramDestinationType;
  label?: string;
  enabled?: boolean;
}

export interface TelegramSettings {
  botTokenMasked: string;
  chatIdMasked: string;
  destinations: TelegramDestination[];
  siteUrl: string;
  enabled: boolean;
  languageMode: TelegramLanguageMode;
  buttonKh: string;
  buttonEn: string;
  connected: boolean;
}

export interface TelegramTestResult {
  success: boolean;
  message: string;
  bot?: { username: string; name: string };
  chats?: { chatId: string; title: string; type: string }[];
  chat?: { title: string; type: string };
  warning?: string;
}

export interface TelegramDiscoveredChat {
  chatId: string;
  type: string;
  title: string;
  username: string | null;
}

export type TelegramPublicationStatus = "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED";

export interface TelegramPublication {
  id: number;
  articleId: number;
  status: TelegramPublicationStatus;
  telegramMessageId: number | null;
  chatId: string | null;
  languageMode: string;
  attempts: number;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramStats {
  published: number;
  pending: number;
  processing: number;
  failed: number;
}

export interface HomepageSectionConfig {
  columns?: number;
  sidebar?: boolean;
}

export interface HomepageSection {
  id: number;
  key: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
  config: HomepageSectionConfig | null;
}

export interface NavigationItem {
  id: number;
  label: string;
  labelEn: string | null;
  type: "home" | "category" | "page" | "link";
  value: string | null;
  sortOrder: number;
  isActive: boolean;
}
