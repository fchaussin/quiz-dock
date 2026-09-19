import { ApiProperty } from '@nestjs/swagger';

/** Candidate base URLs for the invitations (QR code, link) of a session. */
export class JoinAddressesDto {
  @ApiProperty({
    description: 'APP_PUBLIC_URL when configured — the address of a real deployment.',
    nullable: true,
    type: String,
  })
  publicUrl!: string | null;

  @ApiProperty({
    description:
      'LAN addresses of this machine (scheme and port of the request), for local instances.',
    type: [String],
  })
  lan!: string[];
}
