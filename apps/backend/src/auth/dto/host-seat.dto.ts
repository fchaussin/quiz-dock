import { ApiProperty } from '@nestjs/swagger';

/** State of the local-mode host seat (`GET /auth/host-seat`). */
export class HostSeatDto {
  @ApiProperty({
    description:
      'Display name of the current seat holder, or null when the seat is free (always null in OIDC mode).',
    nullable: true,
    type: String,
  })
  holder!: string | null;
}

/** Result of `POST /auth/host-seat/release`. */
export class HostSeatReleaseDto {
  @ApiProperty({ description: 'True when the caller held the seat and it is now free.' })
  released!: boolean;
}
