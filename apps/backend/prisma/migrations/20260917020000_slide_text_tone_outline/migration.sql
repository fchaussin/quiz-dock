-- CreateEnum
CREATE TYPE "slide_text_tone" AS ENUM ('light', 'dark');
-- AlterTable
ALTER TABLE "slide" ADD COLUMN "text_tone" "slide_text_tone" NOT NULL DEFAULT 'light';
ALTER TABLE "slide" ADD COLUMN "text_outline" BOOLEAN NOT NULL DEFAULT false;
