import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Sheet on a native `<dialog>` (top layer, focus trap, Escape for free): a bottom
 * sheet, or a right-hand panel on wide screens with `side="right"`.
 * Dismissing (backdrop, Escape, close button) calls `onClose`; the caller decides
 * whether that needs a confirmation.
 */
export function Drawer({
  open,
  title,
  onClose,
  className,
  side = 'bottom',
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  className?: string;
  /** `right` slides in from the right edge on wide screens (bottom sheet below `lg`). */
  side?: 'bottom' | 'right';
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      try {
        // A dialog left open non-modally (e.g. after a hot reload) must be closed first,
        // otherwise showModal() throws and the sheet would render in the page flow.
        if (d.open && !d.matches(':modal')) d.close();
        if (!d.open) d.showModal();
      } catch {
        d.setAttribute('open', ''); // jsdom: showModal not implemented
      }
    } else if (d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'bg-background text-foreground m-0 mt-auto mb-0 flex max-h-[92dvh] w-full max-w-none flex-col rounded-t-2xl border-t p-0 shadow-2xl backdrop:bg-black/40',
        side === 'right' &&
          'lg:mt-0 lg:mr-0 lg:ml-auto lg:h-dvh lg:max-h-none lg:w-[30rem] lg:rounded-none lg:border-t-0 lg:border-l',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
        <span
          className={cn(
            'bg-muted-foreground/30 absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full',
            side === 'right' && 'lg:hidden',
          )}
        />
        <span className="text-sm font-semibold">{title}</span>
        <button
          type="button"
          aria-label={t('close')}
          className="text-muted-foreground hover:text-foreground rounded p-1"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </dialog>
  );
}
