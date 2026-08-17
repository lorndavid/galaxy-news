-- AlterTable
ALTER TABLE "Article" ADD COLUMN "contentEn" TEXT;
ALTER TABLE "Article" ADD COLUMN "excerptEn" TEXT;
ALTER TABLE "Article" ADD COLUMN "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "Category" ADD COLUMN "nameEn" TEXT;

-- AlterTable
ALTER TABLE "NavigationItem" ADD COLUMN "labelEn" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "nameEn" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advertisement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "target" TEXT NOT NULL DEFAULT '_blank',
    "position" TEXT NOT NULL DEFAULT 'sidebar',
    "device" TEXT NOT NULL DEFAULT 'all',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Advertisement" ("createdAt", "endDate", "id", "image", "isActive", "link", "name", "position", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "image", "isActive", "link", "name", "position", "startDate", "updatedAt" FROM "Advertisement";
DROP TABLE "Advertisement";
ALTER TABLE "new_Advertisement" RENAME TO "Advertisement";
CREATE INDEX "Advertisement_position_isActive_idx" ON "Advertisement"("position", "isActive");
CREATE INDEX "Advertisement_position_device_isActive_idx" ON "Advertisement"("position", "device", "isActive");
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteName" TEXT NOT NULL DEFAULT 'Navatra 4K TV',
    "siteNameEn" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'kh',
    "facebook" TEXT,
    "telegram" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "tickerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tickerTitle" TEXT NOT NULL DEFAULT 'LIVE NEWS',
    "tickerSpeed" TEXT NOT NULL DEFAULT 'medium',
    "tickerDirection" TEXT NOT NULL DEFAULT 'left',
    "tickerCount" INTEGER NOT NULL DEFAULT 10,
    "tickerRefresh" INTEGER NOT NULL DEFAULT 30,
    "tickerBgColor" TEXT NOT NULL DEFAULT '#0b1c39',
    "tickerTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "tickerAccentColor" TEXT NOT NULL DEFAULT '#fc3f00',
    "primaryColor" TEXT NOT NULL DEFAULT '#0d3fa9',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0b1c39',
    "accentColor" TEXT NOT NULL DEFAULT '#fc3f00',
    "surfaceColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#0b1c39',
    "mutedTextColor" TEXT NOT NULL DEFAULT '#667085',
    "borderColor" TEXT NOT NULL DEFAULT '#e5e7eb',
    "fontHeading" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontBody" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontArticle" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontSizeHero" INTEGER NOT NULL DEFAULT 36,
    "fontSizeSection" INTEGER NOT NULL DEFAULT 24,
    "fontSizeCard" INTEGER NOT NULL DEFAULT 18,
    "fontSizeBody" INTEGER NOT NULL DEFAULT 16,
    "radiusPreset" TEXT NOT NULL DEFAULT 'medium',
    "shadowPreset" TEXT NOT NULL DEFAULT 'subtle',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("accentColor", "address", "borderColor", "contactEmail", "contactPhone", "description", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "id", "instagram", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "surfaceColor", "telegram", "textColor", "tiktok", "twitter", "updatedAt", "youtube") SELECT "accentColor", "address", "borderColor", "contactEmail", "contactPhone", "description", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "id", "instagram", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "surfaceColor", "telegram", "textColor", "tiktok", "twitter", "updatedAt", "youtube" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
