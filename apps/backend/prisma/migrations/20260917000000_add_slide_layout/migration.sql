-- CreateEnum
CREATE TYPE "slide_layout" AS ENUM ('auto', 'media_left', 'media_right', 'media_full');
-- AlterTable
ALTER TABLE "slide" ADD COLUMN "layout" "slide_layout" NOT NULL DEFAULT 'auto';
