import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the new user account',
    example: 'alice_crypto_2024',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Aptos public key in hexadecimal format (64 characters)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[0-9a-fA-F]{64}$',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;
}

export class UpdateUsernameDto {
  @ApiProperty({
    description: 'User ID of the account to update (UUID format)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'New username to set for the user account',
    example: 'alice_new_username_2024',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description:
      'New username for the authenticated user profile. User ID is extracted from JWT token.',
    example: 'my_awesome_new_username',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class UserResponse {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'alice_crypto_2024',
  })
  username: string;

  @ApiProperty({
    description: "User's Aptos public key",
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  aptosPublicKey: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T12:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
