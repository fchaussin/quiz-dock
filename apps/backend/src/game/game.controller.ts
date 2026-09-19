import { Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { networkInterfaces } from 'node:os';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ActiveGameDto } from './dto/active-game.dto';
import { JoinAddressesDto } from './dto/join-addresses.dto';
import { GameEngine } from './game.engine';
import { GameService } from './game.service';

/**
 * API REST des parties live (complète le gateway WebSocket). Sert au dashboard à
 * retrouver les parties en cours d'un hôte pour les reprendre (§6.2) — ou les arrêter.
 */
const DOCKER_BRIDGE = /^172\.(1[7-9]|2\d|3[01])\./;

@ApiTags('games')
@ApiBearerAuth()
@Controller('games')
export class GameController {
  constructor(
    private readonly games: GameService,
    private readonly engine: GameEngine,
  ) {}

  /** Parties encore vivantes de l'hôte courant (index Redis auto-nettoyé). */
  @Get('mine')
  @ApiOkResponse({ type: ActiveGameDto, isArray: true })
  mine(@CurrentUser() user: User): Promise<ActiveGameDto[]> {
    return this.games.listActiveHostGames(user.id);
  }

  /**
   * Addresses the invitations may point at: `APP_PUBLIC_URL` when configured
   * (a real deployment), then the machine's LAN IPv4 addresses (or `HOST_LAN_IPS`
   * when the container cannot see the host's interfaces) with the scheme and
   * port of this request. The client adds its own origin and a free field.
   */
  @Get('join-addresses')
  @ApiOkResponse({ type: JoinAddressesDto })
  joinAddresses(@Req() req: Request): JoinAddressesDto {
    const publicUrl = (process.env.APP_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] || req.protocol;
    const hostHeader =
      (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host || '';
    const port = hostHeader.includes(':') ? hostHeader.split(':').pop() : '';
    const withPort = (ip: string) => `${proto}://${ip}${port ? `:${port}` : ''}`;
    const configured = (process.env.HOST_LAN_IPS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const detected = configured.length
      ? configured
      : Object.values(networkInterfaces())
          .flat()
          .filter((i): i is NonNullable<typeof i> => Boolean(i))
          // Docker's default bridge pools (172.17–172.31) are not a LAN anyone can reach.
          .filter((i) => i.family === 'IPv4' && !i.internal && !DOCKER_BRIDGE.test(i.address))
          .map((i) => i.address);
    return {
      publicUrl: publicUrl || null,
      lan: [...new Set(detected)].map(withPort),
    };
  }

  /**
   * Termine une partie (depuis le dashboard, sans socket de contrôle). Réservé à
   * l'hôte propriétaire — `engine.end` refuse les autres. Diffuse `game:ended` à la
   * room et purge l'état (le PIN sort de l'index des parties en cours).
   */
  @Post(':pin/end')
  @HttpCode(204)
  @ApiNoContentResponse()
  end(@CurrentUser() user: User, @Param('pin') pin: string): Promise<void> {
    return this.engine.end(pin, user.id);
  }
}
