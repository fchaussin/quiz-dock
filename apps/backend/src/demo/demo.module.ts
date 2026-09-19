import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { DemoResetService } from './demo-reset.service';

/** Public demo instance guards (`DEMO_MODE`); inert otherwise. */
@Module({
  imports: [MediaModule, UsersModule],
  providers: [DemoResetService],
})
export class DemoModule {}
