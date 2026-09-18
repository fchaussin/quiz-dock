import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { hostSeatControllerRelease } from '../api/generated/auth/auth';
import { meControllerMe } from '../api/generated/me/me';
import { setAuthHeaders, setUnauthorizedHandler } from '../api/http';
import { getOidc } from './oidc';

const STORAGE_KEY = 'live.localUser';

export type AuthMode = 'none' | 'oidc';
export type UserRole = 'host' | 'player' | 'admin';

// État hors-React, lu par la garde de route (synchrone) et configuré au démarrage.
let currentMode: AuthMode = 'none';
let oidcAuthed = false;

/** Configure le mode + l'état OIDC restauré (appelé par main.tsx avant le rendu). */
export function configureAuth(mode: AuthMode, oidcUserAuthed = false): void {
  currentMode = mode;
  oidcAuthed = oidcUserAuthed;
}

/**
 * Suit le cycle de vie du jeton OIDC (mode oidc, après `initOidc`) : chaque
 * renouvellement silencieux remplace l'en-tête Bearer ; une expiration sans
 * renouvellement, ou un 401 du backend, ramène à la page de connexion.
 */
export function bindOidcSession(): void {
  const events = getOidc().events;
  events.addUserLoaded((u) => {
    setAuthHeaders({ Authorization: `Bearer ${u.access_token}` });
    oidcAuthed = true;
  });
  const dropSession = () => {
    oidcAuthed = false;
    setAuthHeaders({});
    void getOidc().removeUser();
    if (window.location.pathname !== '/login') window.location.assign('/login');
  };
  events.addAccessTokenExpired(dropSession);
  events.addUserSignedOut(dropSession);
  setUnauthorizedHandler(dropSession);
}

/** Identité locale (mode none) — utilisée aussi par la garde. */
export function getLocalUser(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/** Garde de route synchrone : l'utilisateur est-il authentifié ? */
export function isAuthenticated(): boolean {
  return currentMode === 'oidc' ? oidcAuthed : !!getLocalUser();
}

export function getAuthMode(): AuthMode {
  return currentMode;
}

/**
 * Jeton d'accès OIDC courant (mode oidc), pour le handshake WebSocket. `null` en
 * mode none (l'hôte s'y identifie par son nom local via `getLocalUser`).
 */
export async function getAccessToken(): Promise<string | null> {
  if (currentMode !== 'oidc') return null;
  const user = await getOidc().getUser();
  return user?.access_token ?? null;
}

function applyLocalUser(name: string | null): void {
  setAuthHeaders(name ? { 'X-Local-User': name } : {});
}

/**
 * Rôle côté backend de l'identité courante (`GET /me`), ou `null` si injoignable.
 * En mode local c'est ici que le **siège d'hôte** se décide : le premier arrivé
 * devient `host`, les autres `player`.
 */
export async function fetchRole(): Promise<UserRole | null> {
  try {
    const { data } = await meControllerMe();
    return data.role as UserRole;
  } catch {
    return null;
  }
}

interface AuthState {
  mode: AuthMode;
  user: string | null;
  /**
   * Connexion mode local (nom). Résout le rôle attribué par le backend (siège
   * d'hôte) : `player` = le siège est déjà pris, `null` = backend injoignable.
   */
  loginLocal: (name: string) => Promise<UserRole | null>;
  /** Connexion mode OIDC (redirection vers l'IdP). */
  loginOidc: () => Promise<void>;
  /** Finalise le retour de redirection OIDC (route /auth/callback). */
  completeOidcLogin: () => Promise<void>;
  logout: () => void | Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  mode = 'none',
  initialUser = null,
}: {
  children: ReactNode;
  mode?: AuthMode;
  initialUser?: string | null;
}) {
  const [user, setUser] = useState<string | null>(() => {
    if (mode === 'oidc') return initialUser;
    const stored = getLocalUser();
    applyLocalUser(stored); // synchrone, avant tout rendu enfant
    return stored;
  });

  const loginLocal = useCallback(async (name: string) => {
    const trimmed = name.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    applyLocalUser(trimmed);
    setUser(trimmed);
    const role = await fetchRole();
    if (role === 'player') {
      // Siège d'hôte pris : on ne garde PAS l'identité (sinon la garde de route
      // et la nav la traiteraient comme un hôte connecté).
      localStorage.removeItem(STORAGE_KEY);
      applyLocalUser(null);
      setUser(null);
    }
    return role;
  }, []);

  const loginOidc = useCallback(async () => {
    await getOidc().signinRedirect();
  }, []);

  const completeOidcLogin = useCallback(async () => {
    const oidcUser = await getOidc().signinRedirectCallback();
    setAuthHeaders({ Authorization: `Bearer ${oidcUser.access_token}` });
    oidcAuthed = true;
    const profile = oidcUser.profile;
    setUser(profile.name ?? profile.preferred_username ?? profile.sub ?? 'Animateur');
  }, []);

  const logout = useCallback(async () => {
    if (mode === 'oidc') {
      oidcAuthed = false;
      setAuthHeaders({});
      setUser(null);
      // RP-initiated logout (end_session_endpoint) ; repli local si le
      // fournisseur n'en expose pas.
      try {
        await getOidc().signoutRedirect();
        return; // navigation en cours vers l'IdP
      } catch {
        await getOidc().removeUser();
      }
    } else {
      // Rend le siège d'hôte (no-op si on ne le tenait pas) avant d'oublier l'identité.
      await hostSeatControllerRelease().catch(() => undefined);
      localStorage.removeItem(STORAGE_KEY);
    }
    applyLocalUser(null);
    setUser(null);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, user, loginLocal, loginOidc, completeOidcLogin, logout }),
    [mode, user, loginLocal, loginOidc, completeOidcLogin, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  }
  return ctx;
}
