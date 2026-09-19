/**
 * `DEMO_MODE=true` — a public, unattended instance (strangers take the host
 * seat, write quizzes, run sessions). Independent of `AUTH_MODE`: local mode says
 * who may host, demo mode says the instance is open to all and adds guards on
 * top — a short host seat, no media uploads, a periodic reset to a blank state.
 * Read lazily so tests can flip the variable.
 */
export const isDemoMode = (): boolean => process.env.DEMO_MODE === 'true';

/** The seat lasts this long; a claim while holding it renews from now. */
export const DEMO_SEAT_MINUTES = 5;

/** The reset runs this often… */
export const DEMO_RESET_INTERVAL_MS = 60 * 60_000;

/** …but waits for live sessions to end, at most this long past the last reset. */
export const DEMO_RESET_MAX_DEFER_MS = 3 * 60 * 60_000;
