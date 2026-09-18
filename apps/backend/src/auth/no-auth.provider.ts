import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { type AuthPrincipal, type AuthProvider, LOCAL_SUB_PREFIX } from './auth-provider';

/** Slug déterministe (minuscule, sans accent, alphanumérique + tirets). */
export function localSlug(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'default';
}

/**
 * Mode `AUTH_MODE=none` : pas de JWT. L'hôte s'identifie par un simple nom local
 * via l'en-tête `X-Local-User` (SPECIFICATIONS §1) ; deux requêtes avec le même
 * nom → même `sub`. Le rôle n'est PAS porté par le principal : il est attribué au
 * provisionnement par le **siège d'hôte** (`HostSeatService`) — premier arrivé
 * dans l'espace hôte = `host`, les autres = `player`.
 */
@Injectable()
export class NoAuthProvider implements AuthProvider {
  async authenticate(req: Request): Promise<AuthPrincipal> {
    const header = req.headers['x-local-user'];
    const raw = (Array.isArray(header) ? header[0] : header)?.trim();
    const displayName = raw && raw.length > 0 ? raw : 'Animateur local';
    return {
      sub: `${LOCAL_SUB_PREFIX}${localSlug(displayName)}`,
      displayName,
      email: null,
      roles: [],
    };
  }
}
