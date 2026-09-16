-- Questions get the same optional full-cover background as slides.
ALTER TABLE "question" ADD COLUMN "background_media_id" CHAR(26);
ALTER TABLE "question" ADD COLUMN "background_gradient" JSONB;
ALTER TABLE "question" ADD COLUMN "text_tone" "slide_text_tone" NOT NULL DEFAULT 'light';
ALTER TABLE "question" ADD COLUMN "text_outline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "question" ADD CONSTRAINT "question_background_media_id_fkey" FOREIGN KEY ("background_media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
