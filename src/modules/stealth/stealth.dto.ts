import { ApiProperty } from '@nestjs/swagger';

export class CreateMetaAddressResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the meta-address',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  metaId: string;

  @ApiProperty({
    description: 'Public key for scanning transactions (hex format)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  scanPublic: string;

  @ApiProperty({
    description: 'Public key for spending transactions (hex format)',
    example:
      '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  spendPublic: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the meta-address was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}
