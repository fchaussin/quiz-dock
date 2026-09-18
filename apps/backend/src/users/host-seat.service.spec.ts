import type { AuthPrincipal } from '../auth/auth-provider';
import type { PrismaService } from '../prisma/prisma.service';
import type { SampleQuizzesService } from '../quizzes/samples/sample-quizzes.service';
import { HostSeatService } from './host-seat.service';

const alice: AuthPrincipal = { sub: 'local:alice', displayName: 'Alice', email: null, roles: [] };
const bob: AuthPrincipal = { sub: 'local:bob', displayName: 'Bob', email: null, roles: [] };

function makeService(holderSub: string | null) {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(0),
    user: {
      findFirst: jest.fn().mockResolvedValue(holderSub ? { oidcSubject: holderSub } : null),
      upsert: jest.fn(async ({ create }: { create: Record<string, unknown> }) => ({
        id: 'u-' + String(create.oidcSubject),
        ...create,
      })),
    },
  };
  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    user: {
      findFirst: jest.fn().mockResolvedValue(holderSub ? { displayName: 'Alice' } : null),
      updateMany: jest.fn().mockResolvedValue({ count: holderSub ? 1 : 0 }),
    },
  } as unknown as PrismaService;
  const samples = {
    createIfEmpty: jest.fn().mockResolvedValue([]),
  } as unknown as SampleQuizzesService;
  return { service: new HostSeatService(prisma, samples), tx, prisma, samples };
}

describe('HostSeatService', () => {
  it('gives the seat (host) to the first local user and loads the sample quizzes', async () => {
    const { service, tx, samples } = makeService(null);
    const user = await service.provision(alice);
    expect(user.role).toBe('host');
    expect(tx.$executeRaw).toHaveBeenCalled(); // advisory lock taken
    expect(samples.createIfEmpty).toHaveBeenCalledWith('u-local:alice');
  });

  it('keeps the holder as host without reloading samples', async () => {
    const { service, samples } = makeService('local:alice');
    const user = await service.provision(alice);
    expect(user.role).toBe('host');
    expect(samples.createIfEmpty).not.toHaveBeenCalled();
  });

  it('provisions anyone else as player while the seat is held', async () => {
    const { service, tx } = makeService('local:alice');
    const user = await service.provision(bob);
    expect(user.role).toBe('player');
    expect(tx.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ role: 'player' }) }),
    );
  });

  it('release() frees the seat only for a local holder', async () => {
    const { service, prisma } = makeService('local:alice');
    await expect(service.release('local:alice')).resolves.toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { oidcSubject: 'local:alice', role: 'host' } }),
    );
    await expect(service.release('oidc-sub-123')).resolves.toBe(false);
  });

  it('isLocal() recognises local-mode subjects', () => {
    expect(HostSeatService.isLocal('local:alice')).toBe(true);
    expect(HostSeatService.isLocal('f2c1…')).toBe(false);
  });
});
