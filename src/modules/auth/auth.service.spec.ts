import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { NonceService } from './nonce.service.js';

// Mock Aptos SDK
jest.mock('@aptos-labs/ts-sdk', () => ({
  AptosConfig: jest.fn().mockImplementation(() => ({})),
  Network: { TESTNET: 'testnet' },
  deserializePublicKey: jest.fn(),
  deserializeSignature: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let nonceService: NonceService;
  let jwtService: JwtService;

  const mockUser: User = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    aptosPublicKey: '0x1234567890abcdef',
    createdAt: new Date(),
    updatedAt: new Date(),
    metaAddresses: [],
  };

  const mockUsersService = {
    createUser: jest.fn(),
    findByAptosPublicKey: jest.fn(),
  };

  const mockNonceService = {
    generateNonce: jest.fn(),
    validateAndUseNonce: jest.fn(),
    getNonceMessage: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: NonceService,
          useValue: mockNonceService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    nonceService = module.get<NonceService>(NonceService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate nonce and message', async () => {
      const aptosPublicKey = '0x1234567890abcdef';
      const nonce = 'test-nonce-value';
      const message = 'Sign this message to authenticate with nonce: test-nonce-value';

      mockNonceService.generateNonce.mockResolvedValue(nonce);
      mockNonceService.getNonceMessage.mockReturnValue(message);

      const result = await service.generateNonce(aptosPublicKey);

      expect(result).toEqual({ nonce, message });
      expect(nonceService.generateNonce).toHaveBeenCalledWith(aptosPublicKey);
      expect(nonceService.getNonceMessage).toHaveBeenCalledWith(nonce);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      aptosPublicKey: '0x1234567890abcdef',
      signature: '0xsignature',
      nonce: 'test-nonce',
    };

    beforeEach(() => {
      // Mock signature verification
      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(undefined);
    });

    it('should register user successfully', async () => {
      const token = 'jwt-token';
      mockNonceService.validateAndUseNonce.mockResolvedValue(true);
      mockUsersService.createUser.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          userId: mockUser.userId,
          username: mockUser.username,
          aptosPublicKey: mockUser.aptosPublicKey,
        },
      });
      expect(service['verifySignature']).toHaveBeenCalledWith(
        registerDto.aptosPublicKey,
        registerDto.signature,
        registerDto.nonce,
      );
      expect(nonceService.validateAndUseNonce).toHaveBeenCalledWith(
        registerDto.nonce,
        registerDto.aptosPublicKey,
      );
      expect(usersService.createUser).toHaveBeenCalledWith({
        username: registerDto.username,
        aptosPublicKey: registerDto.aptosPublicKey,
      });
    });

    it('should throw error if signature verification fails', async () => {
      jest.spyOn(service as any, 'verifySignature').mockRejectedValue(
        new UnauthorizedException('Invalid signature'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('Invalid signature'),
      );
    });

    it('should throw error if nonce validation fails', async () => {
      mockNonceService.validateAndUseNonce.mockRejectedValue(
        new Error('Invalid nonce'),
      );

      await expect(service.register(registerDto)).rejects.toThrow('Invalid nonce');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      aptosPublicKey: '0x1234567890abcdef',
      signature: '0xsignature',
      nonce: 'test-nonce',
    };

    beforeEach(() => {
      // Mock signature verification
      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(undefined);
    });

    it('should login user successfully', async () => {
      const token = 'jwt-token';
      mockNonceService.validateAndUseNonce.mockResolvedValue(true);
      mockUsersService.findByAptosPublicKey.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          userId: mockUser.userId,
          username: mockUser.username,
          aptosPublicKey: mockUser.aptosPublicKey,
        },
      });
      expect(service['verifySignature']).toHaveBeenCalledWith(
        loginDto.aptosPublicKey,
        loginDto.signature,
        loginDto.nonce,
      );
      expect(nonceService.validateAndUseNonce).toHaveBeenCalledWith(
        loginDto.nonce,
        loginDto.aptosPublicKey,
      );
      expect(usersService.findByAptosPublicKey).toHaveBeenCalledWith(
        loginDto.aptosPublicKey,
      );
    });

    it('should throw error if user not found', async () => {
      mockNonceService.validateAndUseNonce.mockResolvedValue(true);
      mockUsersService.findByAptosPublicKey.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.login(loginDto)).rejects.toThrow('User not found');
    });
  });

  describe('verifySignature', () => {
    const aptosPublicKeyHex = '0x1234567890abcdef';
    const signatureHex = '0xsignature';
    const nonce = 'test-nonce';

    it('should verify signature successfully', async () => {
      const mockPublicKey = {
        verifySignatureAsync: jest.fn().mockResolvedValue(true),
      };
      const mockSignature = {};
      const message = 'Sign this message to authenticate with nonce: test-nonce';

      const { deserializePublicKey, deserializeSignature } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockReturnValue(mockPublicKey);
      deserializeSignature.mockReturnValue(mockSignature);
      mockNonceService.getNonceMessage.mockReturnValue(message);

      await expect(
        service['verifySignature'](aptosPublicKeyHex, signatureHex, nonce),
      ).resolves.not.toThrow();

      expect(deserializePublicKey).toHaveBeenCalledWith(aptosPublicKeyHex);
      expect(deserializeSignature).toHaveBeenCalledWith(signatureHex);
      expect(mockPublicKey.verifySignatureAsync).toHaveBeenCalledWith({
        aptosConfig: expect.any(Object),
        message,
        signature: mockSignature,
        options: {
          throwErrorWithReason: true,
        },
      });
    });

    it('should throw UnauthorizedException if signature is invalid', async () => {
      const mockPublicKey = {
        verifySignatureAsync: jest.fn().mockResolvedValue(false),
      };
      const mockSignature = {};
      const message = 'Sign this message to authenticate with nonce: test-nonce';

      const { deserializePublicKey, deserializeSignature } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockReturnValue(mockPublicKey);
      deserializeSignature.mockReturnValue(mockSignature);
      mockNonceService.getNonceMessage.mockReturnValue(message);

      await expect(
        service['verifySignature'](aptosPublicKeyHex, signatureHex, nonce),
      ).rejects.toThrow(new UnauthorizedException('Invalid signature'));
    });

    it('should throw UnauthorizedException if verification throws error', async () => {
      const { deserializePublicKey } = require('@aptos-labs/ts-sdk');
      deserializePublicKey.mockImplementation(() => {
        throw new Error('Invalid public key');
      });

      await expect(
        service['verifySignature'](aptosPublicKeyHex, signatureHex, nonce),
      ).rejects.toThrow(
        new UnauthorizedException('Signature verification failed: Invalid public key'),
      );
    });
  });

  describe('generateJwtToken', () => {
    it('should generate JWT token with correct payload', async () => {
      const token = 'jwt-token';
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service['generateJwtToken'](mockUser);

      expect(result).toBe(token);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.userId,
        username: mockUser.username,
        aptosPublicKey: mockUser.aptosPublicKey,
      });
    });
  });
}); 