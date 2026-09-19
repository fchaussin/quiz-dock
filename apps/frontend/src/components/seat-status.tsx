import { useQueryClient } from '@tanstack/react-query';
import { Armchair, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getHostSeatControllerStateQueryKey,
  useHostSeatControllerClaim,
  useHostSeatControllerState,
} from '../api/generated/auth/auth';

/** Re-read the seat this often; the server is the truth (operator release, takeover…). */
const REFRESH_MS = 60_000;

/**
 * Local-mode host seat as seen by its holder. Nothing is stored client-side —
 * the seat belongs to the identity, its expiry to the server: re-read every
 * minute and on focus, counting down in between.
 */
function useSeat(user: string) {
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
  if (!expiresAt) return { expires: false as const };
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
  return {
    expires: true as const,
    minutes,
    label,
    durationMin,
    renew,
    pending: claim.isPending,
    variant: (minutes <= 2 ? 'destructive' : minutes <= 10 ? 'warning' : 'muted') as
      | 'destructive'
      | 'warning'
      | 'muted',
    expiresAt,
  };
}

/** Topbar tag: the countdown in plain sight (colour = urgency); nothing when the seat has no expiry. */
export function SeatCountdown({ user }: { user: string }) {
  const { t } = useTranslation('auth');
  const seat = useSeat(user);
  if (!seat?.expires) return null;
  return (
    <Badge
      variant={seat.variant}
      className="gap-1"
      title={t('seat.expiresTitle', { time: new Date(seat.expiresAt).toLocaleTimeString() })}
    >
      <Armchair className="size-3" />
      <span className="tabular-nums">{seat.label}</span>
    </Badge>
  );
}

/** User-menu row: the seat's state and its renewal. */
export function SeatMenuRow({ user }: { user: string }) {
  const { t } = useTranslation('auth');
  const seat = useSeat(user);
  if (!seat) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5">
        <Armchair className="text-muted-foreground size-4" />
        <span className="flex flex-col leading-tight">
          <span className="font-medium">{t('seat.label')}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {seat.expires ? seat.label : t('seat.noExpiryShort')}
          </span>
        </span>
      </span>
      {seat.expires ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={seat.pending}
          onClick={seat.renew}
          title={t('seat.renewHint', { count: seat.durationMin })}
        >
          <RefreshCw className="size-3" />
          {t('seat.renew')}
        </Button>
      ) : null}
    </div>
  );
}
