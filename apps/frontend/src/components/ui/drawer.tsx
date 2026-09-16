import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet on a native `<dialog>` (top layer, focus trap, Escape for free).
 * Dismissing (backdrop, Escape, close button) calls `onClose`; the caller decides
 * whether that needs a confirmation.
 */
export function Drawer({
  open,
  title,
  onClose,
  className,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      try {
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
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
        <span className="bg-muted-foreground/30 absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full " />
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
