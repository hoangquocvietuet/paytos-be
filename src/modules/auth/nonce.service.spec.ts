import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { Nonce } from './entities/nonce.entity.js';
import { NonceService } from './nonce.service.js';

describe('NonceService', () => {
  let service: NonceService;
  let repository: Repository<Nonce>;

  const mockNonce: Nonce = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    value: 'test-nonce-value',
    aptosPublicKey: '0x1234567890abcdef',
    used: false,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonceService,
        {
          provide: getRepositoryToken(Nonce),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NonceService>(NonceService);
    repository = module.get<Repository<Nonce>>(getRepositoryToken(Nonce));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    const aptosPublicKey = '0x1234567890abcdef';

    beforeEach(() => {
      // Mock the cleanup method
      jest.spyOn(service as any, 'cleanupExpiredNonces').mockResolvedValue(undefined);
    });

    it('should generate a new nonce when no existing valid nonce exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockNonce);
      mockRepository.save.mockResolvedValue(mockNonce);

      const result = await service.generateNonce(aptosPublicKey);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // 32 bytes as hex string
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          aptosPublicKey,
          used: false,
        },
        order: { createdAt: 'DESC' },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return existing nonce if still valid', async () => {
      const validNonce = {
        ...mockNonce,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
      };
      mockRepository.findOne.mockResolvedValue(validNonce);

      const result = await service.generateNonce(aptosPublicKey);

      expect(result).toBe(validNonce.value);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should generate new nonce if existing one is expired', async () => {
      const expiredNonce = {
        ...mockNonce,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockRepository.findOne.mockResolvedValue(expiredNonce);
      mockRepository.create.mockReturnValue(mockNonce);
      mockRepository.save.mockResolvedValue(mockNonce);

      const result = await service.generateNonce(aptosPublicKey);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should call cleanup expired nonces', async () => {
      const cleanupSpy = jest.spyOn(service as any, 'cleanupExpiredNonces');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockNonce);
      mockRepository.save.mockResolvedValue(mockNonce);

      await service.generateNonce(aptosPublicKey);

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('validateAndUseNonce', () => {
    const nonceValue = 'test-nonce-value';
    const aptosPublicKey = '0x1234567890abcdef';

    it('should validate and mark nonce as used successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockNonce);
      mockRepository.update.mockResolvedValue({});

      const result = await service.validateAndUseNonce(nonceValue, aptosPublicKey);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          value: nonceValue,
          aptosPublicKey,
          used: false,
        },
      });
      expect(mockRepository.update).toHaveBeenCalledWith(mockNonce.id, { used: true });
    });

    it('should throw BadRequestException if nonce not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.validateAndUseNonce(nonceValue, aptosPublicKey)).rejects.toThrow(
        new BadRequestException('Invalid nonce'),
      );
    });

    it('should throw BadRequestException if nonce is expired', async () => {
      const expiredNonce = {
        ...mockNonce,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockRepository.findOne.mockResolvedValue(expiredNonce);

      await expect(service.validateAndUseNonce(nonceValue, aptosPublicKey)).rejects.toThrow(
        new BadRequestException('Nonce has expired'),
      );
    });

    it('should not update nonce if it is expired', async () => {
      const expiredNonce = {
        ...mockNonce,
        expiresAt: new Date(Date.now() - 1000),
      };
      mockRepository.findOne.mockResolvedValue(expiredNonce);

      try {
        await service.validateAndUseNonce(nonceValue, aptosPublicKey);
      } catch (error) {
        // Expected to throw
      }

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getNonceMessage', () => {
    it('should return formatted message with nonce', () => {
      const nonce = 'test-nonce-123';
      const result = service.getNonceMessage(nonce);

      expect(result).toBe('Sign this message to authenticate with nonce: test-nonce-123');
    });

    it('should handle different nonce formats', () => {
      const nonce = 'abc123def456';
      const result = service.getNonceMessage(nonce);

      expect(result).toBe('Sign this message to authenticate with nonce: abc123def456');
    });
  });

  describe('cleanupExpiredNonces', () => {
    it('should delete expired nonces', async () => {
      mockRepository.delete.mockResolvedValue({});

      // Access private method for testing
      await (service as any).cleanupExpiredNonces();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: LessThan(expect.any(Date)),
      });
    });
  });
}); 