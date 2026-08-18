-- AlterTable (SiteSettings): add multi-destination + site URL columns
ALTER TABLE "SiteSettings" ADD COLUMN "telegramDestinations" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "telegramSiteUrl" TEXT;

-- RedefineTable (TelegramPublication): unique(articleId) -> unique(articleId, chatId)
-- SQLite cannot drop a column-level unique constraint, so the table is rebuilt.
CREATE TABLE "new_TelegramPublication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telegramMessageId" INTEGER,
    "chatId" TEXT,
    "languageMode" TEXT NOT NULL DEFAULT 'both',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "nextAttemptAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramPublication_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TelegramPublication" ("id", "articleId", "status", "telegramMessageId", "chatId", "languageMode", "attempts", "errorMessage", "nextAttemptAt", "publishedAt", "createdAt", "updatedAt")
SELECT "id", "articleId", "status", "telegramMessageId", "chatId", "languageMode", "attempts", "errorMessage", "nextAttemptAt", "publishedAt", "createdAt", "updatedAt"
FROM "TelegramPublication";
DROP TABLE "TelegramPublication";
ALTER TABLE "new_TelegramPublication" RENAME TO "TelegramPublication";
CREATE UNIQUE INDEX "TelegramPublication_articleId_chatId_key" ON "TelegramPublication" ("articleId", "chatId");
CREATE INDEX "TelegramPublication_articleId_idx" ON "TelegramPublication" ("articleId");
CREATE INDEX "TelegramPublication_status_idx" ON "TelegramPublication" ("status");
