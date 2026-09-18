import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { SampleQuizzesService } from './samples/sample-quizzes.service';

@Module({
  controllers: [QuizzesController],
  providers: [QuizzesService, SampleQuizzesService],
  exports: [SampleQuizzesService],
})
export class QuizzesModule {}
