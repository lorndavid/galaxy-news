-- CreateTable
CREATE TABLE "LiveStream" (
    "id" SERIAL NOT NULL,
    "titleKh" TEXT NOT NULL,
    "titleEn" TEXT,
    "descriptionKh" TEXT,
    "descriptionEn" TEXT,
    "facebookUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'HOMEPAGE',
    "isHomepage" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveStream_status_idx" ON "LiveStream"("status");
CREATE INDEX "LiveStream_isHomepage_idx" ON "LiveStream"("isHomepage");
CREATE INDEX "LiveStream_isFeatured_idx" ON "LiveStream"("isFeatured");
CREATE INDEX "LiveStream_startAt_idx" ON "LiveStream"("startAt");
CREATE INDEX "LiveStream_displayOrder_idx" ON "LiveStream"("displayOrder");
