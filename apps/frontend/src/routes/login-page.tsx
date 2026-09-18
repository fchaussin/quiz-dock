import { Link, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHostSeatControllerState } from '../api/generated/auth/auth';
import { useAuth } from '../auth/auth-context';

/** Connexion animateur : mode local (nom) ou redirection OIDC selon `AUTH_MODE`. */
export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { mode, loginLocal, loginOidc } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [seatTaken, setSeatTaken] = useState(false);
  // Mode local : qui tient le siège d'hôte (le premier arrivé ; les autres ne
  // peuvent que participer). Affiché avant même de saisir un nom.
  const { data: seat } = useHostSeatControllerState({ query: { enabled: mode === 'none' } });
  const holder = seat?.data.holder ?? null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const role = await loginLocal(name);
    if (role === 'player') {
      setSeatTaken(true);
      return;
    }
    void navigate({ to: '/dashboard' });
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {mode === 'oidc' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t('login.oidcHint')}</p>
            <Button type="button" onClick={() => void loginOidc()}>
              {t('login.oidcSubmit')}
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
            {holder ? (
              <p className="rounded-md bg-muted p-3 text-sm" role="status">
                {t('login.seatHeldBy', { name: holder })}
              </p>
            ) : null}
            <Label htmlFor="name">
              {t('login.nameLabel')}
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('login.namePlaceholder')}
                autoFocus
              />
            </Label>
            <Button type="submit" disabled={!name.trim()}>
              {t('login.submit')}
            </Button>
            {seatTaken ? (
              <p className="text-sm text-destructive" role="alert">
                {t('login.seatTaken')}{' '}
                <Link to="/" className="underline">
                  {t('login.joinInstead')}
                </Link>
              </p>
            ) : null}
            <small className="text-muted-foreground">{t('login.localHint')}</small>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
