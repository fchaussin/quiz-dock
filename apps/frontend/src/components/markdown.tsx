import type { HTMLAttributes } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { cn } from '@/lib/utils';

/**
 * **Restricted** Markdown rendering for text fields typed in the builder (#4).
 * Two profiles:
 * - `block` (description, prompt, explanation): paragraphs, bold, italic,
 *   lists, links, inline/block code.
 * - `inline` (option label): bold, italic, inline code only — no link (the
 *   label is clickable) and no block element.
 *
 * Security: react-markdown emits React elements (never innerHTML), raw HTML is
 * dropped (`skipHtml`) and `javascript:`/`data:` URLs are neutralised by the
 * default `urlTransform`. Any element outside the allowlist is unwrapped
 * (`unwrapDisallowed`): its text stays, its formatting goes.
 */
export type MarkdownProfile = 'block' | 'inline';

const ALLOWED: Record<MarkdownProfile, string[]> = {
  block: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'br'],
  inline: ['strong', 'em', 'code'],
};

/** react-markdown passes the hast node as a prop; keep it off the DOM. */
function dom<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

const COMPONENTS: Components = {
  a: (p) => (
    <a
      {...dom(p)}
      className="underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  ul: (p) => <ul {...dom(p)} className="list-disc pl-6 text-left" />,
  ol: (p) => <ol {...dom(p)} className="list-decimal pl-6 text-left" />,
  code: (p) => <code {...dom(p)} className="rounded bg-black/10 px-1 font-mono text-[0.9em]" />,
  pre: (p) => (
    <pre {...dom(p)} className="overflow-x-auto rounded bg-black/10 p-3 text-left text-[0.85em]" />
  ),
};

export interface MarkdownProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: string | null | undefined;
  profile?: MarkdownProfile;
}

/**
 * `block` renders a `<div>` (spaced paragraphs); `inline` a `<span>`. A
 * semantic heading is set with `role="heading"` + `aria-level` on the wrapper:
 * an `<h1>` cannot contain the `<p>` elements the `block` profile emits.
 */
export function Markdown({ children, profile = 'block', className, ...rest }: MarkdownProps) {
  if (!children) return null;
  const content = (
    <ReactMarkdown
      allowedElements={ALLOWED[profile]}
      unwrapDisallowed
      skipHtml
      components={COMPONENTS}
    >
      {children}
    </ReactMarkdown>
  );
  return profile === 'inline' ? (
    <span className={className} {...rest}>
      {content}
    </span>
  ) : (
    <div className={cn('space-y-2', className)} {...rest}>
      {content}
    </div>
  );
}
