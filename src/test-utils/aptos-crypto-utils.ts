import { Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

import { env } from '../config';
/**
 * Simple utility for Aptos Ed25519 cryptographic operations
 */
class AptosCryptoUtils {
  /**
   * Derive public key from private key
   */
  static getPublicKey(privateKeyHex: string): string {
    if (!privateKeyHex || privateKeyHex.trim() === '') {
      throw new Error('Private key cannot be empty');
    }

    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    return privateKey.publicKey().toString();
  }

  /**
   * Sign a message with private key
   */
  static signMessage(privateKeyHex: string, message: string): string {
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const messageBytes = new TextEncoder().encode(message);
    const signature = privateKey.sign(messageBytes);
    return signature.toString();
  }

  /**
   * Generate a random private key
   */
  static generatePrivateKey(): string {
    return Ed25519PrivateKey.generate().toString();
  }
}

const publicKey = AptosCryptoUtils.getPublicKey(env.wallet.privateKey);
console.log('Public Key:', publicKey);

const signature = AptosCryptoUtils.signMessage(
  env.wallet.privateKey,
  'Sign this message to authenticate with nonce: 5c8e3d0ed352a764f238045a87cd8b58ebba3c01dca27a423573ce86d4290d03',
);
console.log('Signature:', signature);
