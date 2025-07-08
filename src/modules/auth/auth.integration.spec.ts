import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { TestDataFactory, createMockRepository } from '../../test-utils/test-helpers.js';
import { User } from '../users/entities/user.entity.js';
import { UsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { Nonce } from './entities/nonce.entity.js';
import { NonceService } from './nonce.service.js';

describe('Auth Integration Tests', () => {
  let authService: AuthService;
  let nonceService: NonceService;
  let usersService: UsersService;
  let userRepository: any;
  let nonceRepository: any;

  beforeEach(async () => {
    userRepository = createMockRepository();
    nonceRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        NonceService,
        UsersService,
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Nonce),
          useValue: nonceRepository,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    nonceService = module.get<NonceService>(NonceService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('Complete Authentication Flow', () => {
    const aptosPublicKey = '0x1234567890abcdef';
    const username = 'testuser';

    it('should complete full registration flow', async () => {
      // Step 1: Generate nonce
      const mockNonce = TestDataFactory.createMockNonce({ aptosPublicKey });
      nonceRepository.findOne.mockResolvedValue(null); // No existing nonce
      nonceRepository.create.mockReturnValue(mockNonce);
      nonceRepository.save.mockResolvedValue(mockNonce);
      nonceRepository.delete.mockResolvedValue({});

      const { nonce, message } = await authService.generateNonce(aptosPublicKey);

      expect(nonce).toBeDefined();
      expect(message).toContain(nonce);
      expect(nonceRepository.create).toHaveBeenCalled();
      expect(nonceRepository.save).toHaveBeenCalled();

      // Step 2: Mock signature verification (would normally verify against Aptos)
      jest.spyOn(authService as any, 'verifySignature').mockResolvedValue(undefined);

      // Step 3: Register user
      const mockUser = TestDataFactory.createMockUser({ username, aptosPublicKey });
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      nonceRepository.findOne.mockResolvedValue(mockNonce); // Nonce exists
      nonceRepository.update.mockResolvedValue({}); // Mark nonce as used

      const registerResult = await authService.register({
        username,
        aptosPublicKey,
        signature: '0xmocksignature',
        nonce: mockNonce.value,
      });

      expect(registerResult).toHaveProperty('access_token');
      expect(registerResult).toHaveProperty('user');
      expect(registerResult.user.username).toBe(username);
      expect(registerResult.user.aptosPublicKey).toBe(aptosPublicKey);
      expect(nonceRepository.update).toHaveBeenCalledWith(mockNonce.id, { used: true });
    });

    it('should complete full login flow', async () => {
      // Setup: User already exists
      const mockUser = TestDataFactory.createMockUser({ username, aptosPublicKey });
      userRepository.findOne.mockResolvedValue(mockUser);

      // Step 1: Generate nonce for login
      const mockNonce = TestDataFactory.createMockNonce({ aptosPublicKey });
      nonceRepository.findOne.mockResolvedValue(null);
      nonceRepository.create.mockReturnValue(mockNonce);
      nonceRepository.save.mockResolvedValue(mockNonce);
      nonceRepository.delete.mockResolvedValue({});

      const { nonce } = await authService.generateNonce(aptosPublicKey);

      // Step 2: Mock signature verification
      jest.spyOn(authService as any, 'verifySignature').mockResolvedValue(undefined);

      // Step 3: Login
      nonceRepository.findOne.mockResolvedValue(mockNonce); // Nonce exists for validation
      nonceRepository.update.mockResolvedValue({}); // Mark nonce as used

      const loginResult = await authService.login({
        aptosPublicKey,
        signature: '0xmocksignature',
        nonce: mockNonce.value,
      });

      expect(loginResult).toHaveProperty('access_token');
      expect(loginResult).toHaveProperty('user');
      expect(loginResult.user.username).toBe(username);
      expect(loginResult.user.aptosPublicKey).toBe(aptosPublicKey);
    });

    it('should prevent nonce reuse', async () => {
      // Setup: Used nonce
      const usedNonce = TestDataFactory.createUsedNonce({ aptosPublicKey });
      nonceRepository.findOne.mockResolvedValue(null); // Used nonce won't be found because query filters for used: false

      // Should reject used nonce
      await expect(
        nonceService.validateAndUseNonce(usedNonce.value, aptosPublicKey),
      ).rejects.toThrow('Invalid nonce');
    });

    it('should handle expired nonce', async () => {
      // Setup: Expired nonce
      const expiredNonce = TestDataFactory.createExpiredNonce({ aptosPublicKey });
      nonceRepository.findOne.mockResolvedValue(expiredNonce);

      // Should reject expired nonce
      await expect(
        nonceService.validateAndUseNonce(expiredNonce.value, aptosPublicKey),
      ).rejects.toThrow('Nonce has expired');
    });

    it('should prevent duplicate user registration', async () => {
      // Setup: User already exists
      const existingUser = TestDataFactory.createMockUser({ aptosPublicKey });
      userRepository.findOne
        .mockResolvedValueOnce(null) // No user with username
        .mockResolvedValueOnce(existingUser); // But user with public key exists

      await expect(
        usersService.createUser({ username: 'newuser', aptosPublicKey }),
      ).rejects.toThrow('User with Aptos public key already exists');
    });

    it('should clean up expired nonces', async () => {
      // Setup nonce cleanup
      nonceRepository.delete.mockResolvedValue({ affected: 5 });

      // Generate new nonce (triggers cleanup)
      const mockNonce = TestDataFactory.createMockNonce({ aptosPublicKey });
      nonceRepository.findOne.mockResolvedValue(null);
      nonceRepository.create.mockReturnValue(mockNonce);
      nonceRepository.save.mockResolvedValue(mockNonce);

      await nonceService.generateNonce(aptosPublicKey);

      // Verify cleanup was called
      expect(nonceRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object), // LessThan matcher
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection errors gracefully', async () => {
      nonceRepository.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        nonceService.generateNonce('0x1234567890abcdef'),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT signing errors', async () => {
      const jwtService = {
        signAsync: jest.fn().mockRejectedValue(new Error('JWT signing failed')),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { 
            provide: NonceService, 
            useValue: { 
              validateAndUseNonce: jest.fn().mockResolvedValue(true)
            } 
          },
          { 
            provide: UsersService, 
            useValue: { 
              createUser: jest.fn().mockResolvedValue(TestDataFactory.createMockUser())
            } 
          },
          { provide: JwtService, useValue: jwtService },
        ],
      }).compile();

      const authService = module.get<AuthService>(AuthService);
      jest.spyOn(authService as any, 'verifySignature').mockResolvedValue(undefined);

      await expect(
        authService.register({
          username: 'test',
          aptosPublicKey: '0x123',
          signature: '0xsig',
          nonce: 'nonce',
        }),
      ).rejects.toThrow('JWT signing failed');
    });
  });
}); 