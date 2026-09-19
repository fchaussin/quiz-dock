import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** State of the local-mode host seat (`GET /auth/host-seat`). */
export class HostSeatDto {
  @ApiProperty({
    description:
      'Display name of the current seat holder, or null when the seat is free (always null in OIDC mode).',
    nullable: true,
    type: String,
  })
  holder!: string | null;

  @ApiProperty({
    description: 'When the seat frees itself automatically; null = no expiry (or free seat).',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  expiresAt!: string | null;

  @ApiProperty({
    description:
      'When the holder took or renewed the seat (lets a client renew for the same duration); null when free.',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  claimedAt!: string | null;
}

/** Claim body: optional auto-expiry (5 min … 7 days), null/absent = no expiry. */
export const claimHostSeatSchema = z.object({
  expiresInMinutes: z
    .number()
    .int()
    .min(5)
    .max(7 * 24 * 60)
    .nullable()
    .optional(),
});

export class ClaimHostSeatDto extends createZodDto(claimHostSeatSchema) {}

/** Result of `POST /auth/host-seat/release`. */
export class HostSeatReleaseDto {
  @ApiProperty({ description: 'True when the caller held the seat and it is now free.' })
  released!: boolean;
}
