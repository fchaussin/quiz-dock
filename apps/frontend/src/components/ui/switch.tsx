import { cn } from '@/lib/utils';

/**
 * On/off setting that applies immediately (no submit). For a choice submitted
 * with an action, or a multiple selection, keep a checkbox.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...rest
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type' | 'role'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'focus-visible:ring-ring relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}
