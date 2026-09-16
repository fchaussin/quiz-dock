import { Prisma } from '@prisma/client';
import type {
  OptionColor,
  OptionShape,
  PointsMode,
  PublicOption,
  QuestionStartPayload,
  QuestionType,
} from '@quiz-dock/contracts';
import { basePointsFor } from './scoring';
import type { QuizSnapshot, SnapshotQuestion, SnapshotSlide } from './game.types';
import type { SlideShowPayload } from '@quiz-dock/contracts';

/** Forme Prisma attendue par le constructeur de snapshot (relations incluses). */
const quizWithContent = Prisma.validator<Prisma.QuizDefaultArgs>()({
  include: {
    questions: {
      orderBy: { orderIndex: 'asc' },
      include: {
        media: true,
        options: { orderBy: { orderIndex: 'asc' }, include: { media: true } },
        acceptedAnswers: true,
      },
    },
    slides: { orderBy: { orderIndex: 'asc' }, include: { media: true } },
  },
});
export type QuizWithContent = Prisma.QuizGetPayload<typeof quizWithContent>;
export const QUIZ_SNAPSHOT_INCLUDE = quizWithContent.include;

const mediaOf = (m: { url: string; kind: string } | null) =>
  m ? { url: m.url, kind: m.kind as 'image' | 'audio' } : null;

/**
 * Construit le snapshot serveur figé d'un quiz (SPECIFICATIONS §8). Fonction pure :
 * résout les points de base depuis `pointsMode`, embarque les bonnes réponses
 * (secret serveur) et les réponses texte normalisées. La boucle live ne touche
 * plus la base après cet appel.
 */
export function buildSnapshot(quiz: QuizWithContent): QuizSnapshot {
  return {
    quizId: quiz.id,
    title: quiz.title,
    description: quiz.description,
    language: quiz.language,
    questions: quiz.questions.map(
      (q): SnapshotQuestion => ({
        id: q.id,
        orderIndex: q.orderIndex,
        type: q.type as QuestionType,
        prompt: q.prompt,
        media: mediaOf(q.media),
        answerExplanation: q.answerExplanation ?? null,
        timeLimitS: q.timeLimitS,
        revealDelayS: q.revealDelayS ?? null,
        basePoints: basePointsFor(q.pointsMode as PointsMode),
        numericValue: q.numericValue === null ? null : Number(q.numericValue),
        numericTolerance: q.numericTolerance === null ? null : Number(q.numericTolerance),
        acceptedAnswersNormalized: q.acceptedAnswers.map((a) => a.normalized),
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          color: o.color as OptionColor,
          shape: o.shape as OptionShape,
          media: mediaOf(o.media),
          isCorrect: o.isCorrect,
          correctOrderIndex: o.correctOrderIndex,
        })),
      }),
    ),
    slides: buildSnapshotSlides(quiz),
  };
}

/**
 * Slides (#7) resolved onto question indexes: anchored before the question they
 * reference, or after the last one when unanchored. Sorted by (anchor, orderIndex).
 */
function buildSnapshotSlides(quiz: QuizWithContent): SnapshotSlide[] {
  const indexById = new Map(quiz.questions.map((q, i) => [q.id, i]));
  const end = quiz.questions.length;
  return quiz.slides
    .map((s) => ({
      slide: s,
      anchor: s.beforeQuestionId === null ? end : (indexById.get(s.beforeQuestionId) ?? end),
    }))
    .sort((a, b) => a.anchor - b.anchor || a.slide.orderIndex - b.slide.orderIndex)
    .map(({ slide, anchor }) => ({
      id: slide.id,
      beforeQuestionIndex: anchor,
      title: slide.title,
      body: slide.body,
      media: mediaOf(slide.media),
      displayDelayS: slide.displayDelayS,
    }));
}

/** Public `slide:show` payload (#7): everything in a slide is meant to be shown. */
export function buildSlideShow(slide: SnapshotSlide, slideIndex: number): SlideShowPayload {
  return {
    slideIndex,
    questionIndex: slide.beforeQuestionIndex,
    title: slide.title,
    body: slide.body,
    media: slide.media,
    displayDelayS: slide.displayDelayS,
  };
}

/**
 * Construit le payload public `question:start` (contrat §9) par **allowlist stricte**
 * (anti-triche §7) : on ne recopie QUE `{id,text,color,shape,media}` des options —
 * jamais `isCorrect`/`correctOrderIndex`, ni la cible numérique/réponses texte.
 * Le secret ne fuit pas par oubli de suppression : il n'est jamais ajouté.
 */
export function buildQuestionStart(
  question: SnapshotQuestion,
  questionIndex: number,
  startedAt: number,
  endsAt: number,
): QuestionStartPayload {
  const hasOptions = question.options.length > 0;
  const options: PublicOption[] | undefined = hasOptions
    ? question.options.map((o) => ({
        id: o.id,
        text: o.text,
        color: o.color,
        shape: o.shape,
        media: o.media,
      }))
    : undefined;
  return {
    questionIndex,
    type: question.type,
    prompt: question.prompt,
    media: question.media,
    options,
    timeLimitS: question.timeLimitS,
    basePoints: question.basePoints,
    startedAt,
    endsAt,
  };
}
