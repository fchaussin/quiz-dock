/** Parsed command line: positional arguments and `--flag[=value]` options. */
export interface ParsedArgs {
  command: string | null;
  positional: string[];
  flags: Record<string, string | true>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=', 2);
      flags[key] = value ?? true;
    } else {
      positional.push(arg);
    }
  }
  const [command = null, ...rest] = positional;
  return { command, positional: rest, flags };
}
