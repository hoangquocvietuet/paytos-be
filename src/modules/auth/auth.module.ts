import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Nonce } from './entities/nonce.entity.js';
import { AptosSignatureGuard } from './guards/aptos-signature.guard.js';
import { CombinedAuthGuard } from './guards/combined-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { NonceService } from './nonce.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nonce]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key', // Use env variable in production
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule, // Import users module to access users service
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    NonceService,
    JwtStrategy,
    JwtAuthGuard,
    AptosSignatureGuard,
    CombinedAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, AptosSignatureGuard, CombinedAuthGuard],
})
export class AuthModule {}
