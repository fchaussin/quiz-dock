import { Link, Outlet, useMatches, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeatCountdown, SeatMenuRow } from '@/components/seat-status';
import { UserMenu } from '@/components/user-menu';
import { useAuth } from '../auth/auth-context';
import { APP_NAME, appConfig } from '../config';

/** Route id → `titles.*` key in `common`; the document title reads "<page> · <app>". */
const TITLE_KEYS: Record<string, string> = {
  '/login': 'login',
  '/dashboard': 'dashboard',
  '/quizzes/$quizId': 'editor',
  '/quizzes/$quizId/preview': 'preview',
  '/quizzes/$quizId/feedback': 'feedback',
  '/quizzes/$quizId/sessions': 'sessions',
  '/quizzes/$quizId/sessions/$sessionId': 'session',
  '/quizzes/$quizId/sessions/$sessionId/players/$playerResultId': 'player',
  '/present/$pin/control': 'control',
  '/present/$pin/screen': 'screen',
  '/join': 'join',
  '/join/$pin': 'join',
};

export function RootLayout() {
  const { t } = useTranslation(['auth', 'common']);
  const matches = useMatches();
  useEffect(() => {
    const key = [...matches]
      .reverse()
      .map((m) => TITLE_KEYS[m.routeId])
      .find(Boolean);
    document.title = key ? `${t(`common:titles.${key}`)} · ${APP_NAME}` : APP_NAME;
  }, [matches, t]);
  const { user, mode, logout } = useAuth();
  const navigate = useNavigate();
  // Three shells: the projected screen has no chrome at all; participants (guests on a
  // phone) get the brand only; hosts and editors get the full app navigation.
  const routeId = matches[matches.length - 1]?.routeId ?? '';
  const shell = routeId.startsWith('/present/$pin/screen')
    ? 'bare'
    : routeId.startsWith('/join')
      ? 'participant'
      : 'app';

  if (shell === 'bare') {
    return (
      <div className="flex min-h-screen flex-col">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
        {shell === 'participant' ? (
          <span className="flex items-center gap-2 text-lg font-bold">
            <img src={appConfig.logoUrl} alt="" className="h-7 w-auto rounded-md" />
            <span>{APP_NAME}</span>
          </span>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <img src={appConfig.logoUrl} alt="" className="h-7 w-auto rounded-md" />
            <span>{APP_NAME}</span>
          </Link>
        )}
        <nav className="flex items-center gap-3 text-sm">
          {shell === 'participant' ? (
            // Filled by the player page (avatar, nickname, Leave) through a portal.
            <div id="participant-topbar" className="flex items-center gap-2" />
          ) : user ? (
            <>
              <Link to="/dashboard" className="whitespace-nowrap hover:underline">
                {t('nav.myQuizzes')}
              </Link>
              {/* A seat countdown stays in plain sight; renewal and log out live in the user menu. */}
              {mode === 'none' ? <SeatCountdown user={user} /> : null}
              <UserMenu
                user={user}
                onLogout={() => {
                  void Promise.resolve(logout()).then(() => navigate({ to: '/login' }));
                }}
              >
                {mode === 'none' ? <SeatMenuRow user={user} /> : null}
              </UserMenu>
            </>
          ) : (
            <Link to="/login" className="hover:underline">
              {t('nav.loginLink')}
            </Link>
          )}
        </nav>
      </header>
      {/* Wide but bounded: ~1440px, the usual ceiling for app layouts; pages narrow themselves when reading matters. */}
      <main
        className={
          shell === 'participant'
            ? 'mx-auto w-full max-w-lg flex-1 px-4 py-4'
            : 'mx-auto w-full max-w-[90rem] flex-1 px-6 py-6 lg:px-10'
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
