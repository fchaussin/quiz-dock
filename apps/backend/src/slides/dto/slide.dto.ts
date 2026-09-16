import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { gradientSchema, slideBlockSchema } from './slide-content.schema';

/** A slide as returned by the API (#7). Position = `beforeQuestionId` (null = end) + `orderIndex`. */
export const slideSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  beforeQuestionId: z.string().nullable(),
  orderIndex: z.number().int(),
  blocks: z.array(slideBlockSchema),
  /** Full-cover background media, if any. */
  mediaId: z.string().nullable(),
  gradient: gradientSchema.nullable(),
  textTone: z.enum(['light', 'dark']),
  textOutline: z.boolean(),
  displayDelayS: z.number().int().nullable(),
});

export class SlideDto extends createZodDto(slideSchema) {}
