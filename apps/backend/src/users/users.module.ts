import { Module } from '@nestjs/common';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { HostSeatService } from './host-seat.service';
import { UsersService } from './users.service';

@Module({
  imports: [QuizzesModule],
  providers: [UsersService, HostSeatService],
  exports: [UsersService, HostSeatService],
})
export class UsersModule {}
