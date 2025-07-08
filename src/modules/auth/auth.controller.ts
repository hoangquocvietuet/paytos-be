import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  AuthResponse,
  GetNonceDto,
  LoginDto,
  RegisterDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  async getNonce(@Body() getNonceDto: GetNonceDto) {
    return await this.authService.generateNonce(getNonceDto.aptosPublicKey);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.login(loginDto);
  }

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
