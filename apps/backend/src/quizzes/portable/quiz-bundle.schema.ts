import { z } from 'zod';
import { gradientSchema } from '../../common/background.schema';
import { QUESTION_TYPES } from '../../questions/dto/question-content.schema';

/**
 * Portable quiz bundle (#19): `quiz.json` next to a `media/` folder, shipped as
 * a zip and shared as-is in the Quiz Store. Author-level format — no ids, no
 * owner, no statistics — with media referenced by relative path and the items
 * listed in sequence order (slides and questions interleaved).
 *
 * Structural validation only: once the media are uploaded, each item goes
 * through the API content schemas (`questionContentSchema`, `slideContentSchema`)
 * which carry the per-type rules.
 */
export const BUNDLE_FORMAT = 'quizdock/quiz';
export const BUNDLE_VERSION = 1;

/** A media path inside the bundle: flat, under `media/`, no traversal. */
export const mediaPathSchema = z.string().regex(/^media\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/);

const backgroundBundleFields = {
  backgroundImage: mediaPathSchema.nullable().optional(),
  backgroundGradient: gradientSchema.nullable().optional(),
  textTone: z.enum(['light', 'dark']).optional(),
  textOutline: z.boolean().optional(),
};

const optionBundleSchema = z.object({
  text: z.string().optional(),
  media: mediaPathSchema.optional(),
  color: z.string(),
  shape: z.string(),
  isCorrect: z.boolean().optional(),
  correctOrderIndex: z.number().int().optional(),
});

export const questionBundleSchema = z.object({
  kind: z.literal('question'),
  type: z.enum(QUESTION_TYPES),
  prompt: z.string(),
  media: mediaPathSchema.optional(),
  answerExplanation: z.string().nullable().optional(),
  ...backgroundBundleFields,
  timeLimitS: z.number().int().optional(),
  revealDelayS: z.number().int().nullable().optional(),
  pointsMode: z.enum(['standard', 'double', 'none']).optional(),
  numericValue: z.number().optional(),
  numericTolerance: z.number().optional(),
  options: z.array(optionBundleSchema).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
});

/** Slide blocks are validated by `slideContentSchema` after media resolution; here only the media paths matter. */
export const slideBundleSchema = z.object({
  kind: z.literal('slide'),
  blocks: z.array(z.unknown()).optional(),
  ...backgroundBundleFields,
  displayDelayS: z.number().int().nullable().optional(),
});

export const quizBundleSchema = z.object({
  format: z.literal(BUNDLE_FORMAT),
  version: z.literal(BUNDLE_VERSION),
  quiz: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().nullable().optional(),
    language: z.string().min(2).max(10).optional(),
    feedbackEnabled: z.boolean().optional(),
    cover: mediaPathSchema.nullable().optional(),
  }),
  items: z.array(z.discriminatedUnion('kind', [questionBundleSchema, slideBundleSchema])).max(500),
});

export type QuizBundle = z.infer<typeof quizBundleSchema>;
export type QuestionBundleItem = z.infer<typeof questionBundleSchema>;
export type SlideBundleItem = z.infer<typeof slideBundleSchema>;
