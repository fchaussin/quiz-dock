import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { HostSeatService } from '../users/host-seat.service';
import { AllowAnyRole } from './allow-any-role.decorator';
import { CurrentUser } from './current-user.decorator';
import { HostSeatDto, HostSeatReleaseDto } from './dto/host-seat.dto';
import { Public } from './public.decorator';

/**
 * Local-mode host seat (`AUTH_MODE=none`): who holds it, and a way for the holder
 * to hand it back (called by the SPA on log out).
 */
@ApiTags('auth')
@Controller('auth/host-seat')
export class HostSeatController {
  constructor(private readonly seat: HostSeatService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: HostSeatDto })
  async state(): Promise<HostSeatDto> {
    if (process.env.AUTH_MODE === 'oidc') return { holder: null };
    const holder = await this.seat.holder();
    return { holder: holder?.displayName ?? null };
  }

  @AllowAnyRole()
  @ApiBearerAuth()
  @Post('release')
  @HttpCode(200)
  @ApiOkResponse({ type: HostSeatReleaseDto })
  async release(@CurrentUser() user: User): Promise<HostSeatReleaseDto> {
    return { released: await this.seat.release(user.oidcSubject) };
  }
}
