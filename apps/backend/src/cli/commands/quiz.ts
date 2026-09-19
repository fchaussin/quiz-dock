import { BadRequestException } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';
import type { PrismaService } from '../../prisma/prisma.service';
import type { QuizPortableService } from '../../quizzes/portable/quiz-portable.service';
import { CliError, type Output } from '../output';
import { findUser } from './users';

type Db = Pick<PrismaService, 'user' | 'quiz'>;
type Portable = Pick<QuizPortableService, 'exportZip' | 'importBundle'>;

/** Where a bundle comes from / goes to; `-` is stdin / stdout so the host script can relay. */
export interface BundleIo {
  read(path: string): Promise<Buffer>;
  write(path: string, data: Buffer): Promise<void>;
}

export const diskIo: BundleIo = {
  async read(path) {
    if (path !== '-') return readFile(path);
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  },
  async write(path, data) {
    if (path !== '-') return writeFile(path, data);
    // Wait for the pipe to drain: `process.exit` right after would truncate a large zip.
    await new Promise<void>((resolve, reject) =>
      process.stdout.write(data, (err) => (err ? reject(err) : resolve())),
    );
  },
};

/** `quiz:list [<sub|email>]`: every quiz (or one user's), newest first — where to find an id to export. */
export async function quizList(out: Output, prisma: Db, who?: string): Promise<void> {
  const owner = who ? await findUser(prisma, who) : null;
  const quizzes = await prisma.quiz.findMany({
    where: owner ? { ownerId: owner.id } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: { owner: { select: { oidcSubject: true } } },
  });
  out.table(
    quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      owner: q.owner.oidcSubject,
      status: q.status,
      questions: q.questionCount,
      slug: q.slug,
      revision: q.revision,
      updatedAt: q.updatedAt,
    })),
  );
}

/** `quiz:export <id> <file.zip|->`: the same bundle as the API export, whoever owns the quiz. */
export async function quizExport(
  out: Output,
  portable: Portable,
  id: string,
  target: string,
  io: BundleIo,
): Promise<void> {
  const { filename, zip } = await portable.exportZip(id);
  await io.write(target, zip);
  if (target !== '-') out.line(`Exported ${filename} (${zip.length} bytes) to ${target}.`);
}

/** `quiz:import <file|-> <sub|email>`: a new draft in that user's bank, as the API import does. */
export async function quizImport(
  out: Output,
  prisma: Db,
  portable: Portable,
  source: string,
  who: string,
  io: BundleIo,
): Promise<void> {
  const user = await findUser(prisma, who);
  const buffer = await io.read(source);
  let quiz;
  try {
    quiz = await portable.importBundle(user.id, { buffer, mimetype: 'application/octet-stream' });
  } catch (err) {
    if (err instanceof BadRequestException) throw new CliError(`Import refused: ${reason(err)}`);
    throw err;
  }
  out.line(`Imported "${quiz.title}" (${quiz.id}) as a draft of ${user.displayName}.`);
}

/** The API error as one line: its code, then the parameters naming the culprit. */
function reason(err: BadRequestException): string {
  const body = err.getResponse();
  if (typeof body === 'string') return body;
  const { code, params, message } = body as {
    code?: string;
    params?: Record<string, unknown>;
    message?: string;
  };
  const detail = Object.entries(params ?? {})
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(' ');
  return `${code ?? message ?? 'invalid bundle'}${detail ? ` (${detail})` : ''}`;
}
