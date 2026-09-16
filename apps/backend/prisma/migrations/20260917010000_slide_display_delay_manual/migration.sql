-- 0 = manual override (the host clicks even in auto mode); null = engine default.
ALTER TABLE "slide" DROP CONSTRAINT "slide_display_delay_s_check";
ALTER TABLE "slide" ADD CONSTRAINT "slide_display_delay_s_check" CHECK ("display_delay_s" IS NULL OR ("display_delay_s" >= 0 AND "display_delay_s" <= 600));
