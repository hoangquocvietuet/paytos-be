import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsUUID, Max } from 'class-validator';

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

export class GetMetaAddressesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit?: number = 10;
}

export class GetMetaAddressesResponseDto {
  @ApiProperty({
    description: 'Array of meta-addresses',
    type: [CreateMetaAddressResponseDto],
  })
  data: CreateMetaAddressResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class DeleteMetaAddressParamsDto {
  @ApiProperty({
    description: 'UUID of the meta-address to delete',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID(4, { message: 'metaId must be a valid UUID' })
  metaId: string;
}
