import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

import { Injectable } from '@nestjs/common';

import { env } from '../config/index.js';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: string;

  constructor() {
    // Use JWT secret as encryption key or a dedicated encryption key from env
    this.secretKey = env.jwt.secret;
  }

  /**
   * Encrypt a string using AES-256-CBC
   */
  async encrypt(text: string): Promise<string> {
    try {
      const iv = randomBytes(16);
      const key = (await promisify(scrypt)(
        this.secretKey,
        'salt',
        32,
      )) as Buffer;
      const cipher = createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a string using AES-256-CBC
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');

      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const key = (await promisify(scrypt)(
        this.secretKey,
        'salt',
        32,
      )) as Buffer;
      const decipher = createDecipheriv(this.algorithm, key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}
