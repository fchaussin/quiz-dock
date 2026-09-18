import { type User, UserRole } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { SampleQuizzesService } from '../../quizzes/samples/sample-quizzes.service';
import { CliError, type Output } from '../output';

type Db = Pick<PrismaService, 'user' | 'quiz'>;

/** Finds a user by OIDC subject (`local:<slug>` in local mode) or e-mail. */
export async function findUser(prisma: Db, who: string): Promise<User> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ oidcSubject: who }, { email: who }] },
  });
  if (!user) throw new CliError(`No user with subject or e-mail "${who}".`);
  return user;
}

/** `user:list`: every account, newest first. */
export async function userList(out: Output, prisma: Db): Promise<void> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { quizzes: true } } },
  });
  out.table(
    users.map((u) => ({
      name: u.displayName,
      subject: u.oidcSubject,
      email: u.email,
      role: u.role,
      quizzes: u._count.quizzes,
      createdAt: u.createdAt,
    })),
  );
}

/**
 * `user:set-role <sub|email> admin|player`. `admin` is an operator grant that
 * provisioning never overrides (sticky); `player` revokes it — the role is then
 * derived again from the IdP claims (OIDC) or the host seat (local mode) on the
 * user's next request.
 */
export async function userSetRole(
  out: Output,
  prisma: Db,
  who: string,
  role: string,
): Promise<void> {
  if (role !== UserRole.admin && role !== UserRole.player) {
    throw new CliError(
      `Role must be "admin" (grant) or "player" (revoke); "host" is derived, not assigned.`,
      2,
    );
  }
  const user = await findUser(prisma, who);
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  out.line(
    role === UserRole.admin
      ? `${user.displayName} (${user.oidcSubject}) is now admin.`
      : `${user.displayName} (${user.oidcSubject}) admin grant revoked; role is derived again on next request.`,
  );
}

/** `samples:load <sub|email>`: adds the built-in sample quizzes to that user's bank. */
export async function samplesLoad(
  out: Output,
  prisma: Db,
  samples: Pick<SampleQuizzesService, 'createFor'>,
  who: string,
): Promise<void> {
  const user = await findUser(prisma, who);
  const created = await samples.createFor(user.id);
  out.line(`Loaded ${created.length} sample quiz(zes) for ${user.displayName}:`);
  for (const q of created) out.ok(`${q.title} (${q.id})`);
}
