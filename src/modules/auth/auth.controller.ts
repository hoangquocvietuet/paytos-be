import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  AuthResponse,
  GetNonceDto,
  LoginDto,
  NonceResponse,
  RegisterDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Generate authentication nonce',
    description:
      'Generates a one-time nonce for signature-based authentication. The nonce expires in 5 minutes.',
  })
  @ApiBody({ type: GetNonceDto })
  @ApiResponse({
    status: 201,
    description: 'Nonce generated successfully',
    type: NonceResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid Aptos public key format',
  })
  @Post('nonce')
  async getNonce(@Body() getNonceDto: GetNonceDto) {
    return await this.authService.generateNonce(getNonceDto.aptosPublicKey);
  }

  @ApiOperation({
    summary: 'Register new user account',
    description:
      'Creates a new user account using Aptos signature verification. Requires a valid nonce and signature.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data, signature verification failed, or username already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid signature or expired nonce',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return await this.authService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Login existing user',
    description:
      'Authenticates an existing user using Aptos signature verification.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponse,
  })
  @ApiBadRequestResponse({
    description: 'User not found or invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid signature or expired nonce',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile information of the currently authenticated user.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        username: {
          type: 'string',
          example: 'john_doe_123',
        },
        aptosPublicKey: {
          type: 'string',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token missing or invalid',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return {
      userId: req.user.userId,
      username: req.user.username,
      aptosPublicKey: req.user.aptosPublicKey,
    };
  }
}
