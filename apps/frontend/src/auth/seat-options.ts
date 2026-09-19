/** Auto-expiry choices for the host seat, in minutes (0 = never); shared by sign-in and renewal. */
export const SEAT_EXPIRY_OPTIONS = [60, 240, 1440, 0] as const;
export const SEAT_DEFAULT_EXPIRY = 240;
