-- CreateTable
CREATE TABLE "TelegramPublication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telegramMessageId" INTEGER,
    "chatId" TEXT,
    "languageMode" TEXT NOT NULL DEFAULT 'both',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramPublication_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramLanguageMode" TEXT NOT NULL DEFAULT 'both',
    "telegramButtonKh" TEXT NOT NULL DEFAULT '🇰🇭 អានជាភាសាខ្មែរ',
    "telegramButtonEn" TEXT NOT NULL DEFAULT '🇬🇧 Read in English',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("accentColor", "address", "borderColor", "contactEmail", "contactPhone", "defaultLanguage", "description", "descriptionEn", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "id", "instagram", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "siteNameEn", "surfaceColor", "telegram", "textColor", "tickerAccentColor", "tickerBgColor", "tickerCount", "tickerDirection", "tickerEnabled", "tickerRefresh", "tickerSpeed", "tickerTextColor", "tickerTitle", "tiktok", "twitter", "updatedAt", "youtube") SELECT "accentColor", "address", "borderColor", "contactEmail", "contactPhone", "defaultLanguage", "description", "descriptionEn", "facebook", "favicon", "fontArticle", "fontBody", "fontHeading", "fontSizeBody", "fontSizeCard", "fontSizeHero", "fontSizeSection", "id", "instagram", "logo", "mutedTextColor", "primaryColor", "radiusPreset", "secondaryColor", "shadowPreset", "siteName", "siteNameEn", "surfaceColor", "telegram", "textColor", "tickerAccentColor", "tickerBgColor", "tickerCount", "tickerDirection", "tickerEnabled", "tickerRefresh", "tickerSpeed", "tickerTextColor", "tickerTitle", "tiktok", "twitter", "updatedAt", "youtube" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TelegramPublication_articleId_key" ON "TelegramPublication"("articleId");

-- CreateIndex
CREATE INDEX "TelegramPublication_status_idx" ON "TelegramPublication"("status");
