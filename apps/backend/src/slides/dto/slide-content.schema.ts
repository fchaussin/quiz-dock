import { z } from 'zod';

/**
 * Content of a slide (#7). Title, body (Markdown) and media are all optional but
 * at least one must be set, otherwise there is nothing to show. Bounds on
 * `displayDelayS` match the SQL CHECK.
 */
export const slideContentSchema = z
  .object({
    title: z.string().trim().max(200).nullable().optional(),
    body: z.string().trim().max(5000).nullable().optional(),
    mediaId: z.string().length(26).nullable().optional(),
    displayDelayS: z.number().int().min(1).max(600).nullable().optional(),
    // Composition on screen; `auto` = media above the text.
    layout: z.enum(['auto', 'media_left', 'media_right', 'media_full']).default('auto'),
  })
  .refine((d) => Boolean(d.title || d.body || d.mediaId), {
    message: 'slide.empty',
    path: ['body'],
  });

export type SlideContent = z.infer<typeof slideContentSchema>;
