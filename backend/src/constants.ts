// SQLite (via Prisma) does not support native enums, so role/status
// values are plain strings backed by these constants.

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  AUTHOR: "AUTHOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ArticleStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  SCHEDULED: "SCHEDULED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const CommentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

export const AD_POSITIONS = ["header", "sidebar", "inline", "footer"] as const;
export type AdPosition = (typeof AD_POSITIONS)[number];
