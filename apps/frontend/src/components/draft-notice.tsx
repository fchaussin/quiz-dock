import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/** "A draft was restored" banner with the one action that undoes it. */
export function DraftNotice({ onDiscard }: { onDiscard: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div
      role="status"
      className="bg-amber-50 text-amber-900 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 px-3 py-2 text-sm dark:bg-amber-950 dark:text-amber-100"
    >
      <History className="size-4 shrink-0" />
      <span className="flex-1">{t('draft.restored')}</span>
      <Button type="button" variant="ghost" size="sm" className="h-7" onClick={onDiscard}>
        {t('draft.discard')}
      </Button>
    </div>
  );
}
