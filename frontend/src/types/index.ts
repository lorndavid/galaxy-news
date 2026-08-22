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
  nameEn: string | null;
  nameZh: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  descriptionZh: string | null;
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
  nameZh: string | null;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  titleEn: string | null;
  titleZh: string | null;
  slug: string;
  excerpt: string | null;
  excerptEn: string | null;
  excerptZh: string | null;
  content: string;
  contentEn: string | null;
  contentZh: string | null;
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
  author: Author;
  category: Category;
  tags: Tag[];
  images: ArticleImage[];
}

export interface ArticleImage {
  id: number;
  mediaId: number;
  url: string;
  altText: string | null;
  caption: string | null;
  title: string | null;
  description: string | null;
  cropPosition: string | null;
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
  siteNameEn: string | null;
  logo: string | null;
  favicon: string | null;
  description: string | null;
  descriptionEn: string | null;
  defaultLanguage: "kh" | "en" | "zh";
  facebook: string | null;
  telegram: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  twitter: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;

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
  tickerLayout: "boxed" | "wide" | "fluid";

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
  // Per-language font customization
  fontFamilyKh: string;
  fontFamilyEn: string;
  fontFamilyZh: string;
  fontSizeKh: number;
  fontSizeEn: number;
  fontSizeZh: number;
  fontWeightKh: number;
  fontWeightEn: number;
  fontWeightZh: number;
  fontSizeHero: number;
  fontSizeSection: number;
  fontSizeCard: number;
  fontSizeBody: number;
  radiusPreset: "sharp" | "minimal" | "medium" | "rounded";
  shadowPreset: "none" | "subtle" | "medium" | "strong";
}

export type EditorialLayoutType =
  | "editorial-hero"
  | "editorial-split"
  | "editorial-mosaic"
  | "editorial-three-col"
  | "editorial-compact"
  | "editorial-horizontal"
  | "editorial-list"
  | "editorial-feature-compact"
  | "editorial-magazine"
  | "editorial-minimal";

export interface HomepageSectionConfig {
  columns?: number;
  sidebar?: boolean;
  left?: boolean;
  layoutType?: EditorialLayoutType;
  articleLimit?: number;
  featuredArticleId?: number;
  categoryId?: number;
  accentColor?: string;
}

export interface HomepageSectionPublic {
  key: string;
  label: string;
  labelEn: string | null;
  labelZh: string | null;
  config: HomepageSectionConfig | null;
}

export interface HomepageSection {
  id: number;
  key: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
  config: HomepageSectionConfig | null;
}

export interface NavigationItemConfig {
  layout?: "grid" | "list";
  columns?: number;
}

export interface NavigationItem {
  id: number;
  label: string;
  labelEn: string | null;
  labelZh: string | null;
  type: "home" | "category" | "page" | "link";
  value: string | null;
  config: NavigationItemConfig | null;
  sortOrder: number;
  isActive: boolean;
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
}

export interface TickerData {
  enabled: boolean;
  title: string;
  speed: "slow" | "medium" | "fast";
  direction: "left" | "right";
  refresh: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layout: "boxed" | "wide" | "fluid";
  items: Article[];
}

export interface LiveStream {
  id: number;
  titleKh: string;
  titleEn: string | null;
  descriptionKh: string | null;
  descriptionEn: string | null;
  facebookUrl: string;
  thumbnailUrl: string | null;
  status: string;
  visibility: string;
  isHomepage: boolean;
  isFeatured: boolean;
  displayOrder: number;
  startAt: string | null;
  endAt: string | null;
  effectiveStatus?: string;
  createdAt: string;
  updatedAt: string;
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
