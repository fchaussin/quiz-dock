import type { PrismaService } from '../../prisma/prisma.service';
import type { Output } from '../output';

/**
 * `sessions:purge [--dry-run]`: deletes archived sessions whose retention
 * (`retain_until`, set at archive time) is over — player results, per-question
 * stats and answer logs go with them (cascade). Nothing else purges them.
 */
export async function sessionsPurge(
  out: Output,
  prisma: Pick<PrismaService, 'gameSessionLog'>,
  dryRun: boolean,
  now = new Date(),
): Promise<number> {
  const where = { retainUntil: { lt: now } };
  const count = await prisma.gameSessionLog.count({ where });
  if (count === 0) {
    out.line('No session past its retention date.');
    return 0;
  }
  if (dryRun) {
    out.line(`${count} session(s) past retention would be deleted (dry run).`);
    return count;
  }
  const res = await prisma.gameSessionLog.deleteMany({ where });
  out.line(`Deleted ${res.count} session(s) past retention (and their results).`);
  return res.count;
}
