import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { GameState } from '@quiz-dock/contracts';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HostSeatService } from '../users/host-seat.service';
import {
  DEMO_RESET_INTERVAL_MS,
  DEMO_RESET_MAX_DEFER_MS,
  DEMO_SEAT_MINUTES,
  isDemoMode,
} from './demo.config';

/** Live game hashes are `game:<pin>`; their satellites carry a third segment. */
const GAME_HASH = /^game:\d+$/;

/**
 * Demo instance hygiene: every hour, back to a blank install — users, quizzes,
 * media, sessions, seat, live state. Whatever a visitor typed is gone within
 * the hour. A reset waits while a session is being played (a visitor mid-game
 * should not lose it), but not forever: past `DEMO_RESET_MAX_DEFER_MS` it runs
 * regardless.
 */
@Injectable()
export class DemoResetService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(DemoResetService.name);
  private timer: NodeJS.Timeout | null = null;
  private lastResetAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly media: MediaService,
    private readonly seat: HostSeatService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isDemoMode()) return;
    this.log.warn('DEMO_MODE: short host seat, uploads disabled, hourly reset');
    // A seat taken before the guard (persistent data, or a restart) gets the cap too.
    await this.seat.capExpiry(DEMO_SEAT_MINUTES);
    this.timer = setInterval(() => void this.tick(), DEMO_RESET_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** One scheduled attempt: defer while a game is live (bounded), else reset. */
  async tick(now = Date.now()): Promise<boolean> {
    try {
      if (now - this.lastResetAt < DEMO_RESET_MAX_DEFER_MS && (await this.hasLiveGames())) {
        this.log.log('Demo reset deferred: a session is being played');
        return false;
      }
      await this.reset();
      this.lastResetAt = now;
      return true;
    } catch (err) {
      this.log.error(`Demo reset failed: ${(err as Error).message}`);
      return false;
    }
  }

  /** Any `game:<pin>` hash whose state is not `ended`. */
  async hasLiveGames(): Promise<boolean> {
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', 'game:*', 'COUNT', 200);
      cursor = next;
      for (const key of keys.filter((k) => GAME_HASH.test(k))) {
        const state = await this.redis.hget(key, 'state');
        if (state && state !== GameState.Ended) return true;
      }
    } while (cursor !== '0');
    return false;
  }

  /** Blank install: rows in dependency order (no cascade from users), files, live state. */
  async reset(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.gameSessionLog.deleteMany(),
      this.prisma.quiz.deleteMany(),
      this.prisma.mediaAsset.deleteMany(),
      this.prisma.hostSeat.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
    await this.media.removeAllFiles();
    await this.redis.flushdb();
    this.log.log('Demo reset: back to a blank install');
  }
}
