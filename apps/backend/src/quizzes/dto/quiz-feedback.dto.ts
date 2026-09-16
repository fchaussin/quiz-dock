import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Un avis de joueur (§2.11) tel qu'exposé au propriétaire du quiz. */
export const quizFeedbackItemSchema = z.object({
  id: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  nickname: z.string(),
  createdAt: z.string(),
});

/** Query for the feedback list: a page of `pageSize`, optionally one star rating only. */
export const quizFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export class QuizFeedbackQueryDto extends createZodDto(quizFeedbackQuerySchema) {}

/**
 * Feedback of a quiz: the whole-quiz summary (count, average, per-star
 * distribution) plus one page of items (recent first), filtered or not.
 */
export const quizFeedbackSummarySchema = z.object({
  count: z.number().int(),
  average: z.number(),
  /** Number of reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  distribution: z.array(z.number().int()).length(5),
  items: z.array(quizFeedbackItemSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  /** Items matching the current filter (drives the pager). */
  total: z.number().int(),
});

export class QuizFeedbackSummaryDto extends createZodDto(quizFeedbackSummarySchema) {}
