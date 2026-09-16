import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Full ordered sequence of a quiz's items (questions and slides, #7). Every
 * question and every slide of the quiz must appear exactly once.
 */
export const reorderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(['question', 'slide']),
        id: z.string().length(26),
      }),
    )
    .min(1),
});

export class ReorderItemsDto extends createZodDto(reorderItemsSchema) {}
