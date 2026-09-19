import type { GameView } from './use-game-session';

/** Base URL the invitations point at: the host's choice, else this page's origin. */
export function joinBase(view: Pick<GameView, 'joinBaseUrl'>): string {
  return view.joinBaseUrl ?? window.location.origin;
}
export function joinUrlFor(view: Pick<GameView, 'joinBaseUrl'>, pin: string): string {
  return `${joinBase(view)}/join/${pin}`;
}
/** `host[:port]/join`, what people type on their phone. */
export function joinHostLabel(view: Pick<GameView, 'joinBaseUrl'>): string {
  return `${joinBase(view).replace(/^https?:\/\//, '')}/join`;
}
