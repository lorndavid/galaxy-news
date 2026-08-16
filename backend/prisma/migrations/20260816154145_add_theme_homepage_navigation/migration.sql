-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#fc3f00',
ADD COLUMN     "borderColor" TEXT NOT NULL DEFAULT '#e5e7eb',
ADD COLUMN     "fontArticle" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
ADD COLUMN     "fontBody" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
ADD COLUMN     "fontHeading" TEXT NOT NULL DEFAULT 'Noto Sans Khmer',
ADD COLUMN     "fontSizeBody" INTEGER NOT NULL DEFAULT 16,
ADD COLUMN     "fontSizeCard" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "fontSizeHero" INTEGER NOT NULL DEFAULT 36,
ADD COLUMN     "fontSizeSection" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "mutedTextColor" TEXT NOT NULL DEFAULT '#667085',
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#0d3fa9',
ADD COLUMN     "radiusPreset" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#0b1c39',
ADD COLUMN     "shadowPreset" TEXT NOT NULL DEFAULT 'subtle',
ADD COLUMN     "surfaceColor" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "textColor" TEXT NOT NULL DEFAULT '#0b1c39';

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'link',
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");

-- CreateIndex
CREATE INDEX "HomepageSection_enabled_sortOrder_idx" ON "HomepageSection"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "NavigationItem_isActive_sortOrder_idx" ON "NavigationItem"("isActive", "sortOrder");
