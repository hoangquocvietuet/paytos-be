import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  AptosConfig,
  deserializePublicKey,
  deserializeSignature,
  Network,
} from '@aptos-labs/ts-sdk';

import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

import { AuthResponse, LoginDto, RegisterDto } from './auth.dto.js';
import { NonceService } from './nonce.service.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  private readonly aptosConfig: AptosConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly nonceService: NonceService,
    private readonly jwtService: JwtService,
  ) {
    this.aptosConfig = new AptosConfig({
      network: Network.TESTNET, // or Network.MAINNET for production
    });
  }

  async generateNonce(
    aptosPublicKey: string,
  ): Promise<{ nonce: string; message: string }> {
    const nonce = await this.nonceService.generateNonce(aptosPublicKey);
    const message = this.nonceService.getNonceMessage(nonce);

    return { nonce, message };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { username, aptosPublicKey, signature, nonce } = registerDto;

    // Verify the signature
    await this.verifySignature(aptosPublicKey, signature, nonce);

    // Validate and use the nonce
    await this.nonceService.validateAndUseNonce(nonce, aptosPublicKey);

    // Create the user
    const user = await this.usersService.createUser({
      username,
      aptosPublicKey,
    });

    // Generate JWT token
    const token = await this.generateJwtToken(user);

    return {
      access_token: token,
      user: {
        userId: user.userId,
        username: user.username,
        aptosPublicKey: user.aptosPublicKey,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { aptosPublicKey, signature, nonce } = loginDto;

    // Verify the signature
    await this.verifySignature(aptosPublicKey, signature, nonce);

    // Validate and use the nonce
    await this.nonceService.validateAndUseNonce(nonce, aptosPublicKey);

    // Find the user
    const user = await this.usersService.findByAptosPublicKey(aptosPublicKey);

    // Generate JWT token
    const token = await this.generateJwtToken(user);

    return {
      access_token: token,
      user: {
        userId: user.userId,
        username: user.username,
        aptosPublicKey: user.aptosPublicKey,
      },
    };
  }

  private async verifySignature(
    aptosPublicKeyHex: string,
    signatureHex: string,
    nonce: string,
  ): Promise<void> {
    try {
      const publicKey = deserializePublicKey(aptosPublicKeyHex);
      const signature = deserializeSignature(signatureHex);
      const message = this.nonceService.getNonceMessage(nonce);

      const isValid = await publicKey.verifySignatureAsync({
        aptosConfig: this.aptosConfig,
        message,
        signature,
        options: {
          throwErrorWithReason: true,
        },
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Signature verification failed: ${error.message}`,
      );
    }
  }

  private async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
      aptosPublicKey: user.aptosPublicKey,
    };

    return await this.jwtService.signAsync(payload);
  }
}
