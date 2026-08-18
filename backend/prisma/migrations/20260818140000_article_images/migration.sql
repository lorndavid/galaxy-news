-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleImage_articleId_mediaId_key" ON "ArticleImage"("articleId", "mediaId");
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");
CREATE INDEX "ArticleImage_mediaId_idx" ON "ArticleImage"("mediaId");
