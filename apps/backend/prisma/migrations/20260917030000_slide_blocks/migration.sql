-- Slides become a composition of blocks (#7): title → heading, media (unless it was a
-- full cover) → image block, body → text block. A full-cover media stays the background.
ALTER TABLE "slide" ADD COLUMN "blocks" JSONB NOT NULL DEFAULT '[]';

UPDATE "slide" s SET "blocks" = COALESCE((
  SELECT jsonb_agg(b ORDER BY ord) FROM (
    SELECT 1 AS ord, jsonb_build_object('type', 'heading', 'id', 'h-' || s.id, 'text', s.title, 'level', 1) AS b
      WHERE s.title IS NOT NULL AND s.title <> ''
    UNION ALL
    SELECT 2, jsonb_build_object('type', 'image', 'id', 'i-' || s.id, 'mediaId', s.media_id, 'size', 'large', 'align', 'center')
      WHERE s.media_id IS NOT NULL AND s.layout <> 'media_full'
    UNION ALL
    SELECT 3, jsonb_build_object('type', 'text', 'id', 't-' || s.id, 'md', s.body)
      WHERE s.body IS NOT NULL AND s.body <> ''
  ) x
), '[]'::jsonb);

-- Only a full-cover media remains a background.
UPDATE "slide" SET "media_id" = NULL WHERE "layout" <> 'media_full';

ALTER TABLE "slide" DROP COLUMN "title";
ALTER TABLE "slide" DROP COLUMN "body";
ALTER TABLE "slide" DROP COLUMN "layout";
DROP TYPE "slide_layout";
