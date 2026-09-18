import { Injectable, Logger } from '@nestjs/common';
import { type User, UserRole } from '@prisma/client';
import { type AuthPrincipal, LOCAL_SUB_PREFIX } from '../auth/auth-provider';
import { PrismaService } from '../prisma/prisma.service';
import { SampleQuizzesService } from '../quizzes/samples/sample-quizzes.service';

/** Arbitrary app-wide advisory lock id serialising concurrent seat claims. */
const SEAT_LOCK_ID = 714_001;

/**
 * Local mode (`AUTH_MODE=none`) — the **host seat**. Zero configuration: the first
 * local user to reach the host area takes the seat and gets the `host` role; every
 * other local user is provisioned as `player` (may only join sessions) until the
 * holder releases the seat (log out). The seat is *the oldest local user holding
 * the `host` role* — no extra table, and existing installs converge deterministically.
 *
 * Not a security boundary: a local identity is a self-declared name, so whoever
 * types the holder's name shares their seat. Meant for demos and trusted networks.
 */
@Injectable()
export class HostSeatService {
  private readonly log = new Logger(HostSeatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly samples: SampleQuizzesService,
  ) {}

  static isLocal(sub: string): boolean {
    return sub.startsWith(LOCAL_SUB_PREFIX);
  }

  /** Current seat holder, or `null` when the seat is free. */
  holder(): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { role: UserRole.host, oidcSubject: { startsWith: LOCAL_SUB_PREFIX } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Provisions a local principal, claiming the seat when free. Runs under a
   * transaction-scoped advisory lock so two simultaneous first logins cannot both
   * end up as host. Claiming also drops the sample quizzes into the new host's bank.
   */
  async provision(principal: AuthPrincipal): Promise<User> {
    const { user, claimed } = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SEAT_LOCK_ID})`;
      const holder = await tx.user.findFirst({
        where: { role: UserRole.host, oidcSubject: { startsWith: LOCAL_SUB_PREFIX } },
        orderBy: { createdAt: 'asc' },
        select: { oidcSubject: true },
      });
      const isHolder = holder?.oidcSubject === principal.sub;
      const role = !holder || isHolder ? UserRole.host : UserRole.player;
      const user = await tx.user.upsert({
        where: { oidcSubject: principal.sub },
        create: {
          oidcSubject: principal.sub,
          displayName: principal.displayName,
          email: principal.email,
          role,
        },
        update: { displayName: principal.displayName, email: principal.email, role },
      });
      return { user, claimed: !holder };
    });
    if (claimed) {
      this.log.log(`Host seat claimed by "${user.displayName}" (${user.oidcSubject})`);
      await this.samples.createIfEmpty(user.id);
    }
    return user;
  }

  /** Releases the seat if `sub` holds it. Returns whether anything changed. */
  async release(sub: string): Promise<boolean> {
    if (!HostSeatService.isLocal(sub)) return false;
    const res = await this.prisma.user.updateMany({
      where: { oidcSubject: sub, role: UserRole.host },
      data: { role: UserRole.player },
    });
    if (res.count > 0) this.log.log(`Host seat released by ${sub}`);
    return res.count > 0;
  }
}
