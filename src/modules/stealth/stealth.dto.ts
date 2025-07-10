import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
} from 'class-validator';

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

export class GetStealthAddressesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by specific meta-address UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID(4, { message: 'metaId must be a valid UUID' })
  metaId?: string;

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

export class StealthAddressResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the stealth address',
    example: 'a58bd21c-69dd-5483-b678-1f13c3d4e590',
  })
  stealthId: string;

  @ApiProperty({
    description: 'One-time stealth address (hex format)',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  address: string;

  @ApiProperty({
    description: 'View tag for efficient scanning (null if not set)',
    example: 123,
    nullable: true,
  })
  viewTag: number | null;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the stealth address was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'UUID of the parent meta-address',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  metaId: string;
}

export class GetStealthAddressesResponseDto {
  @ApiProperty({
    description: 'Array of stealth addresses',
    type: [StealthAddressResponseDto],
  })
  data: StealthAddressResponseDto[];

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

export class GetStealthAddressParamsDto {
  @ApiProperty({
    description: 'On-chain stealth address (hex format)',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message:
      'Address must be a valid hex string with 0x prefix (66 characters total)',
  })
  address: string;
}

export class GetStealthAddressTransactionsParamsDto {
  @ApiProperty({
    description: 'On-chain stealth address (hex format)',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message:
      'Address must be a valid hex string with 0x prefix (66 characters total)',
  })
  address: string;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction hash (hex format)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[0-9a-fA-F]{66}$',
  })
  txHash: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the transaction occurred',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Direction of the transaction',
    enum: ['IN', 'OUT'],
    example: 'IN',
  })
  direction: 'IN' | 'OUT';

  @ApiProperty({
    description: 'Type of asset transferred',
    enum: ['coin', 'ft', 'nft'],
    example: 'coin',
  })
  assetType: 'coin' | 'ft' | 'nft';

  @ApiProperty({
    description: 'Token contract address (for FT/NFT)',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    required: false,
    nullable: true,
  })
  tokenAddress?: string | null;

  @ApiProperty({
    description: 'Token ID (for NFT)',
    example: '12345',
    required: false,
    nullable: true,
  })
  tokenId?: string | null;

  @ApiProperty({
    description: 'Amount transferred (as string to preserve precision)',
    example: '1000000000',
    required: false,
    nullable: true,
  })
  amount?: string | null;
}
