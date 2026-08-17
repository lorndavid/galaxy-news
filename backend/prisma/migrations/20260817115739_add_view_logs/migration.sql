-- CreateTable
CREATE TABLE "ViewLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewLog_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ViewLog_viewedAt_idx" ON "ViewLog"("viewedAt");

-- CreateIndex
CREATE INDEX "ViewLog_articleId_viewedAt_idx" ON "ViewLog"("articleId", "viewedAt");
