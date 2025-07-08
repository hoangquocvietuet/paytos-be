import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username for the user account',
    example: 'john_doe_123',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Aptos public key in hexadecimal format',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;

  @ApiProperty({
    description: 'Digital signature proving ownership of the private key',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    pattern: '^0x[0-9a-fA-F]+$',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'One-time nonce value obtained from the /auth/nonce endpoint',
    example: 'abc123def456ghi789',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Aptos public key in hexadecimal format',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;

  @ApiProperty({
    description: 'Digital signature proving ownership of the private key',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    pattern: '^0x[0-9a-fA-F]+$',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'One-time nonce value obtained from the /auth/nonce endpoint',
    example: 'abc123def456ghi789',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
}

export class GetNonceDto {
  @ApiProperty({
    description: 'Aptos public key for which to generate a nonce',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;
}

export class AuthResponse {
  @ApiProperty({
    description: 'JWT access token for authenticating subsequent requests',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      username: 'john_doe_123',
      aptosPublicKey:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'Unique user identifier (UUID)',
      },
      username: {
        type: 'string',
        description: 'Username of the user',
      },
      aptosPublicKey: {
        type: 'string',
        description: "User's Aptos public key",
      },
    },
  })
  user: {
    userId: string;
    username: string;
    aptosPublicKey: string;
  };
}

export class NonceResponse {
  @ApiProperty({
    description: 'Generated nonce value for signature creation',
    example: 'abc123def456ghi789',
  })
  nonce: string;

  @ApiProperty({
    description: 'Nonce expiration time in ISO format',
    example: '2024-01-01T12:05:00.000Z',
  })
  expiresAt: string;
}
