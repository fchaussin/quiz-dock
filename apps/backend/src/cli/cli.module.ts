import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { UsersModule } from '../users/users.module';

/**
 * Admin CLI context: only what the commands need. Deliberately NOT `AppModule`,
 * which would spin up the game gateway (Socket.IO), Redis and static serving.
 */
@Module({
  imports: [PrismaModule, UsersModule, QuizzesModule],
})
export class CliModule {}
