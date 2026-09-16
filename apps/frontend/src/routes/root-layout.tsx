import { Link, Outlet, useMatches, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <img src={appConfig.logoUrl} alt="" className="h-7 w-auto rounded-md" />
          <span>{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="whitespace-nowrap hover:underline">
                {t('nav.myQuizzes')}
              </Link>
              <span className="text-muted-foreground hidden sm:inline">{user}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void Promise.resolve(logout()).then(() => navigate({ to: '/login' }));
                }}
              >
                <LogOut className="size-4" />
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">
              {t('nav.loginLink')}
            </Link>
          )}
        </nav>
      </header>
      {/* Wide but bounded: ~1440px, the usual ceiling for app layouts; pages narrow themselves when reading matters. */}
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-6 py-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
