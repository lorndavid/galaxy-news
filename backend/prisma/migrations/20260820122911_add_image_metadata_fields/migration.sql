-- AlterTable
ALTER TABLE "ArticleImage" ADD COLUMN "cropPosition" TEXT DEFAULT 'center';
ALTER TABLE "ArticleImage" ADD COLUMN "description" TEXT;
ALTER TABLE "ArticleImage" ADD COLUMN "title" TEXT;
