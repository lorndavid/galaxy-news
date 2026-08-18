-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "excerptEn" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "contentEn" TEXT,
    "featuredImage" TEXT,
    "authorId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "galleryColumns" INTEGER NOT NULL DEFAULT 3,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("authorId", "categoryId", "content", "contentEn", "createdAt", "excerpt", "excerptEn", "featuredImage", "id", "isBreaking", "isFeatured", "publishedAt", "slug", "status", "title", "titleEn", "updatedAt", "views") SELECT "authorId", "categoryId", "content", "contentEn", "createdAt", "excerpt", "excerptEn", "featuredImage", "id", "isBreaking", "isFeatured", "publishedAt", "slug", "status", "title", "titleEn", "updatedAt", "views" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_slug_idx" ON "Article"("slug");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX "Article_views_idx" ON "Article"("views");
CREATE INDEX "Article_isFeatured_idx" ON "Article"("isFeatured");
CREATE INDEX "Article_isBreaking_idx" ON "Article"("isBreaking");
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
    "bodyBgColor" TEXT NOT NULL DEFAULT '#f8f7f4',
    "headerBgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "headerTextColor" TEXT NOT NULL DEFAULT '#0b1c39',
    "footerBgColor" TEXT NOT NULL DEFAULT '#0b1c39',
    "footerTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "layoutStyle" TEXT NOT NULL DEFAULT 'boxed',
    "shareFacebook" TEXT NOT NULL DEFAULT 'https://www.facebook.com/sharer/sharer.php?u={url}',
    "shareTikTok" TEXT NOT NULL DEFAULT 'https://www.tiktok.com/share?url={url}',
    "shareTelegram" TEXT NOT NULL DEFAULT 'https://t.me/share/url?url={url}&text={title}',
    "shareWhatsapp" TEXT NOT NULL DEFAULT 'https://wa.me/?text={title} {url}',
    "fontHeading" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontBody" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontArticle" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
    "fontSizeHero" INTEGER NOT NULL DEFAULT 36,
    "fontSizeSection" INTEGER NOT NULL DEFAULT 24,
    "fontSizeCard" INTEGER NOT NULL DEFAULT 18,
    "fontSizeBody" INTEGER NOT NULL DEFAULT 16,
    "radiusPreset" TEXT NOT NULL DEFAULT 'sharp',
    "shadowPreset" TEXT NOT NULL DEFAULT 'none',
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "telegramDestinations" TEXT,
    "telegramSiteUrl" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramLanguageMode" TEXT NOT NULL DEFAULT 'both',
    "telegramButtonKh" TEXT NOT NULL DEFAULT '🇰🇭 អានជាភាសាខ្មែរ',
    "telegramButtonEn" TEXT NOT NULL DEFAULT '🇬🇧 Read in English',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("accentColor", "address", "bodyBgColor", "borderColor", "contactEmail", "contactPhone", "defaultLanguage", "description", "descriptionEn", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "footerBgColor", "footerTextColor", "headerBgColor", "headerTextColor", "id", "instagram", "layoutStyle", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "siteNameEn", "surfaceColor", "telegram", "telegramBotToken", "telegramButtonEn", "telegramButtonKh", "telegramChatId", "telegramDestinations", "telegramEnabled", "telegramLanguageMode", "telegramSiteUrl", "textColor", "tickerAccentColor", "tickerBgColor", "tickerCount", "tickerDirection", "tickerEnabled", "tickerRefresh", "tickerSpeed", "tickerTextColor", "tickerTitle", "tiktok", "twitter", "updatedAt", "youtube") SELECT "accentColor", "address", "bodyBgColor", "borderColor", "contactEmail", "contactPhone", "defaultLanguage", "description", "descriptionEn", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "footerBgColor", "footerTextColor", "headerBgColor", "headerTextColor", "id", "instagram", "layoutStyle", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "siteNameEn", "surfaceColor", "telegram", "telegramBotToken", "telegramButtonEn", "telegramButtonKh", "telegramChatId", "telegramDestinations", "telegramEnabled", "telegramLanguageMode", "telegramSiteUrl", "textColor", "tickerAccentColor", "tickerBgColor", "tickerCount", "tickerDirection", "tickerEnabled", "tickerRefresh", "tickerSpeed", "tickerTextColor", "tickerTitle", "tiktok", "twitter", "updatedAt", "youtube" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
