import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { DemoResetService } from './demo-reset.service';

/** Public demo instance guards (`DEMO_MODE`); inert otherwise. */
@Module({
  imports: [MediaModule],
  providers: [DemoResetService],
})
export class DemoModule {}
