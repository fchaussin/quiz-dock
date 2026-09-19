import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getHostSeatControllerStateQueryKey,
  useHostSeatControllerClaim,
  useHostSeatControllerState,
} from '../api/generated/auth/auth';

/** Re-read the seat this often; the server is the truth (operator release, takeover…). */
const REFRESH_MS = 60_000;

/**
 * Local-mode topbar item for the seat holder: how long the seat still lasts,
 * counting down between two server reads, and a one-click renewal for the
 * same duration. Nothing is stored client-side — the seat belongs to the
 * identity, its expiry to the server.
 */
export function SeatStatus({ user }: { user: string }) {
  const { t } = useTranslation('auth');
  const queryClient = useQueryClient();
  const seat = useHostSeatControllerState({
    query: { refetchInterval: REFRESH_MS, refetchOnWindowFocus: true },
  });
  const claim = useHostSeatControllerClaim();
  const holder = seat.data?.data.holder ?? null;
  const expiresAt = seat.data?.data.expiresAt ?? null;
  const claimedAt = seat.data?.data.claimedAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (holder !== user) return null;
  if (!expiresAt) {
    return <span className="text-muted-foreground hidden sm:inline">{t('seat.noExpiry')}</span>;
  }
  const leftMs = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.ceil(leftMs / 60_000);
  const label =
    minutes >= 60
      ? t('seat.leftHours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 })
      : t('seat.leftMinutes', { count: minutes });
  // Renew for the duration originally chosen (expiresAt − claimedAt), at least 5 min.
  const durationMin = claimedAt
    ? Math.max(
        5,
        Math.round((new Date(expiresAt).getTime() - new Date(claimedAt).getTime()) / 60_000),
      )
    : 60;
  const renew = () =>
    claim.mutate(
      { data: { expiresInMinutes: durationMin } },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getHostSeatControllerStateQueryKey() }),
      },
    );
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'tabular-nums',
          minutes <= 2
            ? 'text-destructive font-semibold'
            : minutes <= 10
              ? 'text-amber-600'
              : 'text-muted-foreground',
        )}
        title={t('seat.expiresTitle', { time: new Date(expiresAt).toLocaleTimeString() })}
      >
        {t('seat.label')} · {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        disabled={claim.isPending}
        onClick={renew}
        title={t('seat.renewHint', { count: durationMin })}
      >
        <RefreshCw className="size-3.5" />
        {t('seat.renew')}
      </Button>
    </span>
  );
}
