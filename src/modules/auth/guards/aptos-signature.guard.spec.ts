import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AptosSignatureGuard } from './aptos-signature.guard.js';

// Mock Aptos SDK
jest.mock('@aptos-labs/ts-sdk', () => ({
  AptosConfig: jest.fn().mockImplementation(() => ({})),
  Network: { TESTNET: 'testnet' },
  deserializePublicKey: jest.fn(),
  deserializeSignature: jest.fn(),
}));

describe('AptosSignatureGuard', () => {
  let guard: AptosSignatureGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AptosSignatureGuard],
    }).compile();

    guard = module.get<AptosSignatureGuard>(AptosSignatureGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (body: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  }) as ExecutionContext;

  describe('canActivate', () => {
    const validRequestBody = {
      signatureHex: '0xsignature',
      messageHex: 'test message',
      publicKeyHex: '0x1234567890abcdef',
    };

    it('should return true for valid signature', async () => {
      const mockPublicKey = {
        verifySignatureAsync: jest.fn().mockResolvedValue(true),
      };
      const mockSignature = {};

      const { deserializePublicKey, deserializeSignature } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockReturnValue(mockPublicKey);
      deserializeSignature.mockReturnValue(mockSignature);

      const context = createMockContext(validRequestBody);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(deserializePublicKey).toHaveBeenCalledWith(validRequestBody.publicKeyHex);
      expect(deserializeSignature).toHaveBeenCalledWith(validRequestBody.signatureHex);
      expect(mockPublicKey.verifySignatureAsync).toHaveBeenCalledWith({
        aptosConfig: expect.any(Object),
        message: validRequestBody.messageHex,
        signature: mockSignature,
        options: {
          throwErrorWithReason: true,
        },
      });
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      const mockPublicKey = {
        verifySignatureAsync: jest.fn().mockResolvedValue(false),
      };
      const mockSignature = {};

      const { deserializePublicKey, deserializeSignature } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockReturnValue(mockPublicKey);
      deserializeSignature.mockReturnValue(mockSignature);

      const context = createMockContext(validRequestBody);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid signature'),
      );
    });

    it('should throw UnauthorizedException if signatureHex is missing', async () => {
      const invalidBody = { ...validRequestBody, signatureHex: undefined };
      const context = createMockContext(invalidBody);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing signature, public key, or message'),
      );
    });

    it('should throw UnauthorizedException if messageHex is missing', async () => {
      const invalidBody = { ...validRequestBody, messageHex: undefined };
      const context = createMockContext(invalidBody);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing signature, public key, or message'),
      );
    });

    it('should throw UnauthorizedException if publicKeyHex is missing', async () => {
      const invalidBody = { ...validRequestBody, publicKeyHex: undefined };
      const context = createMockContext(invalidBody);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing signature, public key, or message'),
      );
    });

    it('should throw UnauthorizedException if signature verification throws error', async () => {
      const { deserializePublicKey } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockImplementation(() => {
        throw new Error('Invalid public key format');
      });

      const context = createMockContext(validRequestBody);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Signature verification failed'),
      );
    });

    it('should handle empty request body', async () => {
      const context = createMockContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing signature, public key, or message'),
      );
    });

    it('should handle null request body', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing signature, public key, or message'),
      );
    });
  });
}); 