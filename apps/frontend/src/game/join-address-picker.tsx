import { Globe } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useGameControllerJoinAddresses } from '../api/generated/games/games';

const STORAGE_KEY = 'live.joinBaseUrl';
const CUSTOM = '__custom__';

/**
 * Lobby control: the address the invitations (QR code, link) point at.
 * Candidates: the deployment's public URL when configured, the machine's LAN
 * addresses (a local instance), this page's origin, or anything typed. The
 * choice is sent to the session (every screen follows) and remembered on this
 * browser for the next session.
 */
export function JoinAddressPicker({
  current,
  onChange,
}: {
  current: string;
  onChange: (baseUrl: string) => void;
}) {
  const { t } = useTranslation('live');
  const { data } = useGameControllerJoinAddresses();
  const origin = window.location.origin;
  const candidates = useMemo(() => {
    const list = [data?.data.publicUrl, ...(data?.data.lan ?? []), origin].filter(
      (x): x is string => Boolean(x),
    );
    return [...new Set(list)];
  }, [data, origin]);
  const [custom, setCustom] = useState('');
  const isCustom = !candidates.includes(current);

  // First time on this session: apply the remembered choice, else the best candidate
  // (public URL, then a LAN address when the console runs on localhost).
  const [initialised, setInitialised] = useState(false);
  useEffect(() => {
    if (initialised || !data) return;
    setInitialised(true);
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    const localhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin);
    const preferred =
      remembered ?? data.data.publicUrl ?? (localhost ? data.data.lan[0] : undefined) ?? null;
    if (preferred && preferred !== current) onChange(preferred);
  }, [data, initialised, current, origin, onChange]);

  const choose = (baseUrl: string) => onChange(baseUrl);
  // Remember what the session settled on (normalised by the server) for the next one.
  useEffect(() => {
    if (!initialised) return;
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch {
      /* storage unavailable */
    }
  }, [current, initialised]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Globe className="text-muted-foreground size-4" />
      <label className="text-muted-foreground" htmlFor="join-address">
        {t('control.joinAddress')}
      </label>
      <Select
        id="join-address"
        className="h-8 w-auto min-w-[14rem] text-sm"
        value={isCustom ? CUSTOM : current}
        onChange={(e) => {
          if (e.target.value === CUSTOM) setCustom(current);
          else choose(e.target.value);
        }}
      >
        {candidates.map((c) => (
          <option key={c} value={c}>
            {c}
            {c === data?.data.publicUrl ? ` — ${t('control.joinAddressPublic')}` : ''}
            {c === origin ? ` — ${t('control.joinAddressThisPage')}` : ''}
          </option>
        ))}
        <option value={CUSTOM}>{t('control.joinAddressCustom')}</option>
      </Select>
      {isCustom || custom ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) choose(custom.trim());
          }}
        >
          <Input
            className="h-8 w-56 text-sm"
            placeholder="https://quiz.example.org"
            value={custom || (isCustom ? current : '')}
            onChange={(e) => setCustom(e.target.value)}
            aria-label={t('control.joinAddressCustom')}
          />
          <Button type="submit" size="sm" variant="outline" className="h-8">
            {t('control.joinAddressApply')}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
