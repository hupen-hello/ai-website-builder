ALTER TABLE "Layout" ADD COLUMN "categorySlug" TEXT;

CREATE INDEX "Layout_categorySlug_idx" ON "Layout"("categorySlug");
