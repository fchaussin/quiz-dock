import { Node } from '@tiptap/core';
import { Markdown as MarkdownExt } from '@tiptap/markdown';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Code, Italic, List, ListOrdered, SquareCode } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MarkdownProfile } from './markdown';

/**
 * No-code editor for Markdown fields (#8): WYSIWYG by default, with a toggle
 * to edit the Markdown source. The value in and out is always Markdown, so
 * storage, API and rendering (`Markdown` component) stay unchanged.
 *
 * The allowed formatting mirrors the rendering profile of `Markdown`:
 * `block` = bold, italic, lists, inline/block code; `inline` = bold, italic,
 * inline code in a single paragraph. No links: content is displayed live, on a
 * projected screen or a phone mid-answer, where a link is unusable at best.
 */
export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  profile?: MarkdownProfile;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}

/** Single-paragraph document for the inline profile (no Enter, no blocks). */
const InlineDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'paragraph',
  // Same serialiser as the stock Document node; without it getMarkdown() is empty.
  renderMarkdown: (node, h) => (node.content ? h.renderChildren(node.content, '\n\n') : ''),
});

export function extensionsFor(profile: MarkdownProfile) {
  const common = {
    heading: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    trailingNode: false,
    link: false,
  } as const;
  const kit =
    profile === 'inline'
      ? StarterKit.configure({
          ...common,
          document: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          codeBlock: false,
          hardBreak: false,
        })
      : StarterKit.configure(common);
  return profile === 'inline' ? [InlineDocument, kit, MarkdownExt] : [kit, MarkdownExt];
}

export function MarkdownEditor({
  value,
  onChange,
  profile = 'block',
  placeholder,
  'aria-label': ariaLabel,
  className,
}: MarkdownEditorProps) {
  const { t } = useTranslation('common');
  const [source, setSource] = useState(false);

  const editor = useEditor({
    extensions: extensionsFor(profile),
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: cn(
          'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          profile === 'inline' ? 'min-h-9' : 'min-h-24',
        ),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown()),
  });

  // External value change (form reset, source edit): push it into the editor
  // without emitting an update, unless it already matches.
  useEffect(() => {
    if (!editor || editor.getMarkdown() === value) return;
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  const isEmpty = useEditorState({ editor, selector: ({ editor: e }) => e?.isEmpty ?? true });

  return (
    <div data-markdown-editor className={cn('group flex flex-col gap-1', className)}>
      {/* Inline fields (option labels) keep their row compact: tools appear on focus. */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1',
          profile === 'inline' && !source && 'hidden group-focus-within:flex',
        )}
      >
        {editor && !source ? <Toolbar editor={editor} profile={profile} /> : null}
        <button
          type="button"
          className="text-muted-foreground ml-auto text-xs underline-offset-2 hover:underline"
          aria-pressed={source}
          onClick={() => setSource((s) => !s)}
        >
          {source ? t('markdownEditor.visual') : t('markdownEditor.source')}
        </button>
      </div>
      {source ? (
        <Textarea
          aria-label={ariaLabel}
          rows={profile === 'inline' ? 1 : 4}
          className={cn('font-mono', profile === 'inline' && 'min-h-9')}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="relative">
          {isEmpty && placeholder ? (
            <span className="text-muted-foreground pointer-events-none absolute top-2 left-3 text-sm">
              {placeholder}
            </span>
          ) : null}
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

function Toolbar({ editor, profile }: { editor: Editor; profile: MarkdownProfile }) {
  const { t } = useTranslation('common');
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      code: e.isActive('code'),
      codeBlock: e.isActive('codeBlock'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <>
      <ToolButton
        label={t('markdownEditor.bold')}
        active={active.bold}
        onClick={() => chain().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolButton>
      <ToolButton
        label={t('markdownEditor.italic')}
        active={active.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolButton>
      <ToolButton
        label={t('markdownEditor.code')}
        active={active.code}
        onClick={() => chain().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolButton>
      {profile === 'block' ? (
        <>
          <ToolButton
            label={t('markdownEditor.bulletList')}
            active={active.bulletList}
            onClick={() => chain().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolButton>
          <ToolButton
            label={t('markdownEditor.orderedList')}
            active={active.orderedList}
            onClick={() => chain().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolButton>
          <ToolButton
            label={t('markdownEditor.codeBlock')}
            active={active.codeBlock}
            onClick={() => chain().toggleCodeBlock().run()}
          >
            <SquareCode className="size-4" />
          </ToolButton>
        </>
      ) : null}
    </>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className={cn(
        'hover:bg-muted inline-flex size-7 items-center justify-center rounded-md',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}
