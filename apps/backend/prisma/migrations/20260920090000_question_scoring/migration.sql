-- Scoring variants per question type (closest / partial credit / lenient text)
-- and a `fixed` points mode (no speed weighting).
ALTER TYPE "points_mode" ADD VALUE IF NOT EXISTS 'fixed';

CREATE TYPE "question_scoring" AS ENUM ('standard', 'closest', 'partial', 'lenient');
ALTER TABLE "question" ADD COLUMN "scoring" "question_scoring" NOT NULL DEFAULT 'standard';
