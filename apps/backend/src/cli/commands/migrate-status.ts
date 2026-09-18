import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PrismaService } from '../../prisma/prisma.service';

export interface MigrationStatus {
  applied: string[];
  pending: string[];
  failed: string[];
}

/**
 * Compares the migration folders shipped with the app (`prisma/migrations`) with
 * Prisma's `_prisma_migrations` table — no `prisma` CLI needed at runtime.
 */
export async function migrationStatus(
  prisma: Pick<PrismaService, '$queryRaw'>,
  migrationsDir = resolve(process.cwd(), 'prisma/migrations'),
): Promise<MigrationStatus> {
  const shipped = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const rows = await prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
  >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
  const applied = new Set(
    rows.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => r.migration_name),
  );
  const failed = rows
    .filter((r) => !r.finished_at && !r.rolled_back_at)
    .map((r) => r.migration_name);
  return {
    applied: shipped.filter((m) => applied.has(m)),
    pending: shipped.filter((m) => !applied.has(m) && !failed.includes(m)),
    failed,
  };
}
