import { ConflictException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { AuthPrincipal } from '../auth/auth-provider';
import type { PrismaService } from '../prisma/prisma.service';
import type { SampleQuizzesService } from '../quizzes/samples/sample-quizzes.service';
import { HostSeatService } from './host-seat.service';

const alice = { id: 'u-alice', oidcSubject: 'local:alice', displayName: 'Alice' } as User;
const bob = { id: 'u-bob', oidcSubject: 'local:bob', displayName: 'Bob' } as User;
const principal = (u: User): AuthPrincipal => ({
  sub: u.oidcSubject,
  displayName: u.displayName,
  email: null,
  roles: [],
});

interface Seat {
  id: number;
  userId: string;
  expiresAt: Date | null;
  user?: { displayName: string };
}

function makeService(seat: Seat | null, knownUsers: User[] = [alice, bob]) {
  const users = new Map(knownUsers.map((u) => [u.oidcSubject, u]));
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(0),
    hostSeat: {
      findUnique: jest.fn().mockResolvedValue(seat),
      upsert: jest.fn().mockResolvedValue(undefined),
    },
    user: { update: jest.fn().mockResolvedValue(undefined) },
  };
  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    hostSeat: {
      findUnique: jest.fn().mockResolvedValue(seat),
      deleteMany: jest.fn(async ({ where }: { where: { userId: string } }) => ({
        count: seat?.userId === where.userId ? 1 : 0,
      })),
    },
    user: {
      findUnique: jest.fn(async ({ where }: { where: { oidcSubject: string } }) => {
        const u = users.get(where.oidcSubject);
        return u ? { id: u.id } : null;
      }),
      upsert: jest.fn(async ({ create }: { create: Record<string, unknown> }) => ({
        id: users.get(String(create.oidcSubject))?.id ?? 'u-new',
        ...create,
      })),
      update: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService;
  const samples = {
    createIfEmpty: jest.fn().mockResolvedValue([]),
  } as unknown as SampleQuizzesService;
  return { service: new HostSeatService(prisma, samples), tx, prisma, samples };
}

const future = new Date(Date.now() + 3_600_000);
const past = new Date(Date.now() - 1_000);

describe('HostSeatService.provision', () => {
  it('never claims: a new local user is a player even when the seat is free', async () => {
    const { service, tx, samples } = makeService(null);
    const user = await service.provision(principal(alice));
    expect(user.role).toBe('player');
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(samples.createIfEmpty).not.toHaveBeenCalled();
  });

  it('derives host for the live holder and player for everyone else', async () => {
    const { service } = makeService({ id: 1, userId: alice.id, expiresAt: future });
    expect((await service.provision(principal(alice))).role).toBe('host');
    expect((await service.provision(principal(bob))).role).toBe('player');
  });

  it('demotes the holder once the seat has expired', async () => {
    const { service } = makeService({ id: 1, userId: alice.id, expiresAt: past });
    expect((await service.provision(principal(alice))).role).toBe('player');
  });
});

describe('HostSeatService.claim', () => {
  it('takes a free seat under the advisory lock, with expiry, and loads the samples', async () => {
    const { service, tx, samples } = makeService(null);
    const state = await service.claim(alice, 60);
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.hostSeat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: alice.id }) }),
    );
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: alice.id },
      data: { role: 'host' },
    });
    expect(samples.createIfEmpty).toHaveBeenCalledWith(alice.id);
    expect(state.holder).toBe('Alice');
    expect(state.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 59 * 60_000);
  });

  it('claims without expiry when expiresInMinutes is null', async () => {
    const { service } = makeService(null);
    expect((await service.claim(alice, null)).expiresAt).toBeNull();
  });

  it('refuses (409 host_seat.taken) while another user holds a live seat', async () => {
    const { service, tx } = makeService({ id: 1, userId: alice.id, expiresAt: future });
    await expect(service.claim(bob, null)).rejects.toThrow(ConflictException);
    expect(tx.hostSeat.upsert).not.toHaveBeenCalled();
  });

  it('takes over an expired seat and demotes its previous holder', async () => {
    const { service, tx } = makeService({ id: 1, userId: alice.id, expiresAt: past });
    await service.claim(bob, 30);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: alice.id },
      data: { role: 'player' },
    });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: bob.id }, data: { role: 'host' } });
  });

  it('lets the holder renew their own seat', async () => {
    const { service, tx } = makeService({ id: 1, userId: alice.id, expiresAt: future });
    await expect(service.claim(alice, 120)).resolves.toMatchObject({ holder: 'Alice' });
    expect(tx.hostSeat.upsert).toHaveBeenCalled();
  });
});

describe('HostSeatService.state / release', () => {
  it('reports the live holder, and a free seat once expired', async () => {
    const live = makeService({
      id: 1,
      userId: alice.id,
      expiresAt: future,
      user: { displayName: 'Alice' },
    });
    await expect(live.service.state()).resolves.toMatchObject({
      holder: 'Alice',
      expiresAt: future,
    });
    const expired = makeService({
      id: 1,
      userId: alice.id,
      expiresAt: past,
      user: { displayName: 'Alice' },
    });
    await expect(expired.service.state()).resolves.toEqual({
      holder: null,
      expiresAt: null,
      claimedAt: null,
    });
  });

  it('release() frees the seat only for its holder, and only for local identities', async () => {
    const { service, prisma } = makeService({ id: 1, userId: alice.id, expiresAt: null });
    await expect(service.release(alice)).resolves.toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: alice.id },
      data: { role: 'player' },
    });
    await expect(service.release(bob)).resolves.toBe(false);
    await expect(service.release({ ...bob, oidcSubject: 'oidc-123' } as User)).resolves.toBe(false);
  });
});
