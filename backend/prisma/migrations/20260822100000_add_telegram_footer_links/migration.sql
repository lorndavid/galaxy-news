-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "telegramFooterEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "telegramFooterJoinUs" TEXT,
ADD COLUMN "telegramFooterFacebook" TEXT,
ADD COLUMN "telegramFooterTiktok" TEXT,
ADD COLUMN "telegramFooterYoutube" TEXT,
ADD COLUMN "telegramFooterInstagram" TEXT,
ADD COLUMN "telegramFooterWebsite" TEXT;
