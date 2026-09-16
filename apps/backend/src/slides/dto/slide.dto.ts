import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** A slide as returned by the API (#7). Position = `beforeQuestionId` (null = end) + `orderIndex`. */
export const slideSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  beforeQuestionId: z.string().nullable(),
  orderIndex: z.number().int(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  mediaId: z.string().nullable(),
  displayDelayS: z.number().int().nullable(),
});

export class SlideDto extends createZodDto(slideSchema) {}
