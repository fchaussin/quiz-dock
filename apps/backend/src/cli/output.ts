/** Minimal, dependency-free console output for the admin CLI (English only). */
export interface Output {
  line(text?: string): void;
  ok(text: string): void;
  warn(text: string): void;
  fail(text: string): void;
  table(rows: Record<string, unknown>[]): void;
}

export class ConsoleOutput implements Output {
  line(text = ''): void {
    process.stdout.write(`${text}\n`);
  }
  ok(text: string): void {
    this.line(`  ✓ ${text}`);
  }
  warn(text: string): void {
    this.line(`  ! ${text}`);
  }
  fail(text: string): void {
    this.line(`  ✗ ${text}`);
  }
  table(rows: Record<string, unknown>[]): void {
    if (rows.length === 0) {
      this.line('  (none)');
      return;
    }
    const cols = Object.keys(rows[0]);
    const cell = (v: unknown) =>
      v == null ? '-' : v instanceof Date ? v.toISOString() : String(v);
    const width = cols.map((c) => Math.max(c.length, ...rows.map((r) => cell(r[c]).length)));
    const fmt = (vals: string[]) => `  ${vals.map((v, i) => v.padEnd(width[i])).join('  ')}`;
    this.line(fmt(cols));
    this.line(fmt(width.map((w) => '-'.repeat(w))));
    for (const r of rows) this.line(fmt(cols.map((c) => cell(r[c]))));
  }
}

/** Thrown by a command to end with a message and a non-zero exit code. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
    this.name = 'CliError';
  }
}
