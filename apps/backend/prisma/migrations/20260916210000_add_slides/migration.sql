-- CreateTable
CREATE TABLE "slide" (
    "id" CHAR(26) NOT NULL,
    "quiz_id" CHAR(26) NOT NULL,
    "before_question_id" CHAR(26),
    "order_index" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "media_id" CHAR(26),
    "display_delay_s" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "slide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slide_quiz_id_idx" ON "slide"("quiz_id");

-- AddForeignKey
ALTER TABLE "slide" ADD CONSTRAINT "slide_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "slide" ADD CONSTRAINT "slide_before_question_id_fkey" FOREIGN KEY ("before_question_id") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "slide" ADD CONSTRAINT "slide_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bounds (same spirit as reveal_delay_s).
ALTER TABLE "slide" ADD CONSTRAINT "slide_display_delay_s_check" CHECK ("display_delay_s" IS NULL OR ("display_delay_s" >= 1 AND "display_delay_s" <= 600));
