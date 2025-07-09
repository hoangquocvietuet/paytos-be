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

  // Return string for client display
  getNonceMessage(nonce: string): string {
    return `Sign this message to authenticate with nonce: ${nonce}`;
  }

  // Return binary data for signature verification
  getNonceMessageBytes(nonce: string): Uint8Array {
    const message = `Sign this message to authenticate with nonce: ${nonce}`;
    return new TextEncoder().encode(message);
  }

  // Alternative: Use just the nonce as the message (more secure)
  getNonceAsMessage(nonce: string): Uint8Array {
    // Remove '0x' prefix if present and convert hex to bytes
    const cleanNonce = nonce.startsWith('0x') ? nonce.slice(2) : nonce;
    return new Uint8Array(Buffer.from(cleanNonce, 'hex'));
  }

  private async cleanupExpiredNonces(): Promise<void> {
    await this.nonceRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
