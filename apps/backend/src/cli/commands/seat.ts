import type { HostSeatService } from '../../users/host-seat.service';
import type { Output } from '../output';

/** `seat:status`: who holds the local-mode host seat, since when, until when. */
export async function seatStatus(out: Output, seat: HostSeatService): Promise<void> {
  const details = await seat.details();
  if (!details) {
    out.line('Host seat: free');
    return;
  }
  const expired = details.expiresAt !== null && details.expiresAt <= new Date();
  out.line(`Host seat: ${expired ? 'expired (will be freed on next use)' : 'held'}`);
  out.table([
    {
      holder: details.user.displayName,
      subject: details.user.oidcSubject,
      claimedAt: details.claimedAt,
      expiresAt: details.expiresAt ?? 'never',
    },
  ]);
}

/** `seat:release`: operator override — frees the seat whoever holds it. */
export async function seatRelease(out: Output, seat: HostSeatService): Promise<void> {
  const released = await seat.forceRelease();
  out.line(released ? 'Host seat released.' : 'Host seat was already free.');
}
