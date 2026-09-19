import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { QuizzesController } from './quizzes.controller';
import { QuizPortableService } from './portable/quiz-portable.service';
import { QuizzesService } from './quizzes.service';
import { SampleQuizzesService } from './samples/sample-quizzes.service';

@Module({
  imports: [MediaModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, SampleQuizzesService, QuizPortableService],
  exports: [SampleQuizzesService, QuizPortableService],
})
export class QuizzesModule {}
