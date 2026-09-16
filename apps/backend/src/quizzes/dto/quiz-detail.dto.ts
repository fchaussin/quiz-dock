import { createZodDto } from 'nestjs-zod';
import { questionSchema } from '../../questions/dto/question.dto';
import { slideSchema } from '../../slides/dto/slide.dto';
import { quizSchema } from './quiz.dto';

/** Détail d'un quiz possédé, questions incluses (ordonnées). DTO builder. */
export const quizDetailSchema = quizSchema.extend({
  questions: questionSchema.array(),
  // Slides (#7), sorted by anchor then orderIndex; the client merges them into the sequence.
  slides: slideSchema.array(),
});

export class QuizDetailDto extends createZodDto(quizDetailSchema) {}
