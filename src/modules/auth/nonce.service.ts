import { randomBytes } from 'crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThan, Repository } from 'typeorm';

import { Nonce } from './entities/nonce.entity.js';

@Injectable()
export class NonceService {
  constructor(
    @InjectRepository(Nonce)
    private readonly nonceRepository: Repository<Nonce>,
  ) {}

  async generateNonce(aptosPublicKey: string): Promise<string> {
    // Clean up expired nonces first
    await this.cleanupExpiredNonces();

    // Check if there's already an unused nonce for this public key
    const existingNonce = await this.nonceRepository.findOne({
      where: {
        aptosPublicKey,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingNonce && existingNonce.expiresAt > new Date()) {
      return existingNonce.value;
    }

    // Generate new nonce
    const nonceValue = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const nonce = this.nonceRepository.create({
      value: nonceValue,
      aptosPublicKey,
      expiresAt,
      used: false,
    });

    await this.nonceRepository.save(nonce);
    return nonceValue;
  }

  async validateAndUseNonce(
    nonceValue: string,
    aptosPublicKey: string,
  ): Promise<boolean> {
    const nonce = await this.nonceRepository.findOne({
      where: {
        value: nonceValue,
        aptosPublicKey,
        used: false,
      },
    });

    if (!nonce) {
      throw new BadRequestException('Invalid nonce');
    }

    if (nonce.expiresAt < new Date()) {
      throw new BadRequestException('Nonce has expired');
    }

    // Mark nonce as used
    await this.nonceRepository.update(nonce.id, { used: true });
    return true;
  }

  getNonceMessage(nonce: string): string {
    // Standard message format for Aptos authentication
    return `Sign this message to authenticate with nonce: ${nonce}`;
  }

  private async cleanupExpiredNonces(): Promise<void> {
    await this.nonceRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
