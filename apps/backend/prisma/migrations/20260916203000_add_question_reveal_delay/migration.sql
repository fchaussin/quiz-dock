-- AlterTable
ALTER TABLE "question" ADD COLUMN "reveal_delay_s" INTEGER;
ALTER TABLE "question" ADD CONSTRAINT "question_reveal_delay_s_check" CHECK ("reveal_delay_s" IS NULL OR ("reveal_delay_s" >= 1 AND "reveal_delay_s" <= 300));
