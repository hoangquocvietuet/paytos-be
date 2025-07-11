import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { Repository } from 'typeorm';

import { EncryptionService } from '../../common/encryption.service.js';
import { User } from '../users/entities/user.entity.js';

import { MetaAddress } from './entities/meta-address.entity.js';
import { StealthAddress } from './entities/stealth-address.entity.js';
import { Direction, Transaction } from './entities/transaction.entity.js';
import {
  BalanceResponseDto,
  CreateMetaAddressResponseDto,
  GetMetaAddressesQueryDto,
  GetMetaAddressesResponseDto,
  GetStealthAddressesQueryDto,
  GetStealthAddressesResponseDto,
  StealthAddressResponseDto,
  TransactionResponseDto,
} from './stealth.dto.js';

@Injectable()
export class StealthService {
  constructor(
    @InjectRepository(MetaAddress)
    private readonly metaAddressRepository: Repository<MetaAddress>,
    @InjectRepository(StealthAddress)
    private readonly stealthAddressRepository: Repository<StealthAddress>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new stealth meta-address with scan/spend keypairs
   */
  async createMetaAddress(user: User): Promise<CreateMetaAddressResponseDto> {
    try {
      // Generate two Ed25519 keypairs: one for scanning, one for spending
      const scanKeyPair = this.generateKeyPair();
      const spendKeyPair = this.generateKeyPair();

      // Encrypt the private keys before storing
      const scanPrivateEncrypted = await this.encryptionService.encrypt(
        scanKeyPair.privateKey,
      );
      const spendPrivateEncrypted = await this.encryptionService.encrypt(
        spendKeyPair.privateKey,
      );

      // Create and save meta-address entity
      const metaAddress = this.metaAddressRepository.create({
        user,
        scanPublic: scanKeyPair.publicKey,
        spendPublic: spendKeyPair.publicKey,
        scanPrivateEncrypted,
        spendPrivateEncrypted,
      });

      const savedMetaAddress =
        await this.metaAddressRepository.save(metaAddress);

      // Return only public information
      return this.mapToPublicDto(savedMetaAddress);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create meta-address: ${error.message}`,
      );
    }
  }

  /**
   * Get all meta-addresses for a user with pagination
   */
  async getUserMetaAddresses(
    userId: string,
    query: GetMetaAddressesQueryDto,
  ): Promise<GetMetaAddressesResponseDto> {
    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const [metaAddresses, total] =
        await this.metaAddressRepository.findAndCount({
          where: { user: { userId } },
          order: { createdAt: 'DESC' }, // Most recent first
          skip,
          take: limit,
          select: [
            'metaId',
            'scanPublic',
            'spendPublic',
            'createdAt',
            // Explicitly omit scanPrivateEncrypted and spendPrivateEncrypted
          ],
        });

      const totalPages = Math.ceil(total / limit);

      return {
        data: metaAddresses.map((metaAddress) =>
          this.mapToPublicDto(metaAddress),
        ),
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve meta-addresses: ${error.message}`,
      );
    }
  }

  /**
   * Delete a meta-address and all related data
   */
  async deleteMetaAddress(userId: string, metaId: string): Promise<void> {
    try {
      // First check if the meta-address exists and belongs to the user
      const metaAddress = await this.metaAddressRepository.findOne({
        where: {
          metaId,
          user: { userId },
        },
        relations: ['user'],
      });

      if (!metaAddress) {
        throw new NotFoundException(
          'Meta-address not found or does not belong to user',
        );
      }

      // Delete the meta-address (cascade should handle related data)
      await this.metaAddressRepository.remove(metaAddress);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete meta-address: ${error.message}`,
      );
    }
  }

  /**
   * Get all stealth addresses for a user with optional meta-address filtering
   */
  async getUserStealthAddresses(
    userId: string,
    query: GetStealthAddressesQueryDto,
  ): Promise<GetStealthAddressesResponseDto> {
    try {
      const { metaId, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      // Build query conditions
      const whereConditions: any = {
        metaAddress: {
          user: { userId },
        },
      };

      // Add metaId filter if provided
      if (metaId) {
        whereConditions.metaAddress.metaId = metaId;
      }

      // Get stealth addresses with pagination
      const [stealthAddresses, total] =
        await this.stealthAddressRepository.findAndCount({
          where: whereConditions,
          relations: ['metaAddress', 'metaAddress.user'],
          order: { createdAt: 'DESC' }, // Most recent first
          skip,
          take: limit,
          select: {
            stealthId: true,
            address: true,
            viewTag: true,
            createdAt: true,
            metaAddress: {
              metaId: true,
            },
          },
        });

      const totalPages = Math.ceil(total / limit);

      return {
        data: stealthAddresses.map((stealthAddress) =>
          this.mapToStealthAddressDto(stealthAddress),
        ),
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve stealth addresses: ${error.message}`,
      );
    }
  }

  /**
   * Get a specific stealth address by address for a user
   */
  async getStealthAddressByAddress(
    userId: string,
    address: string,
  ): Promise<StealthAddressResponseDto> {
    try {
      const stealthAddress = await this.stealthAddressRepository.findOne({
        where: {
          address,
          metaAddress: {
            user: { userId },
          },
        },
        relations: ['metaAddress', 'metaAddress.user'],
        select: {
          stealthId: true,
          address: true,
          viewTag: true,
          createdAt: true,
          metaAddress: {
            metaId: true,
          },
        },
      });

      if (!stealthAddress) {
        throw new NotFoundException(
          'Stealth address not found or does not belong to user',
        );
      }

      return this.mapToStealthAddressDto(stealthAddress);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve stealth address: ${error.message}`,
      );
    }
  }

  /**
   * Get transactions for a specific stealth address
   */
  async getStealthAddressTransactions(
    userId: string,
    address: string,
  ): Promise<TransactionResponseDto[]> {
    try {
      // First, resolve the stealth address and verify ownership
      const stealthAddress = await this.stealthAddressRepository.findOne({
        where: {
          address,
          metaAddress: {
            user: { userId },
          },
        },
        relations: ['metaAddress', 'metaAddress.user'],
        select: {
          stealthId: true,
        },
      });

      if (!stealthAddress) {
        throw new NotFoundException(
          'Stealth address not found or does not belong to user',
        );
      }

      // Fetch transactions for this stealth address
      const transactions = await this.transactionRepository.find({
        where: { stealthAddress: { stealthId: stealthAddress.stealthId } },
        order: { timestamp: 'DESC' }, // Most recent first
        select: [
          'txHash',
          'timestamp',
          'direction',
          'assetType',
          'tokenAddress',
          'tokenId',
          'amount',
        ],
      });

      return transactions.map((transaction) =>
        this.mapToTransactionDto(transaction),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve transactions: ${error.message}`,
      );
    }
  }

  /**
   * Get balance for a specific stealth address
   */
  async getStealthAddressBalance(
    userId: string,
    address: string,
  ): Promise<BalanceResponseDto[]> {
    try {
      // First, resolve the stealth address and verify ownership
      const stealthAddress = await this.stealthAddressRepository.findOne({
        where: {
          address,
          metaAddress: {
            user: { userId },
          },
        },
        relations: ['metaAddress', 'metaAddress.user'],
        select: {
          stealthId: true,
        },
      });

      if (!stealthAddress) {
        throw new NotFoundException(
          'Stealth address not found or does not belong to user',
        );
      }

      // Use query builder to aggregate balances
      const balanceResults = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select([
          'transaction.assetType as assetType',
          'transaction.tokenAddress as tokenAddress',
          `SUM(
            CASE 
              WHEN transaction.direction = :inDirection THEN transaction.amount 
              ELSE -transaction.amount 
            END
          ) as balance`,
        ])
        .where('transaction.stealthId = :stealthId', {
          stealthId: stealthAddress.stealthId,
        })
        .andWhere('transaction.amount IS NOT NULL')
        .setParameter('inDirection', Direction.IN)
        .groupBy('transaction.assetType, transaction.tokenAddress')
        .having(
          'SUM(CASE WHEN transaction.direction = :inDirection THEN transaction.amount ELSE -transaction.amount END) != 0',
        )
        .getRawMany();

      return balanceResults.map((result) => ({
        assetType: result.assetType,
        tokenAddress: result.tokenAddress || null,
        balance: result.balance.toString(),
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve balance: ${error.message}`,
      );
    }
  }

  /**
   * Generate an Ed25519 keypair using Aptos SDK
   */
  private generateKeyPair(): { privateKey: string; publicKey: string } {
    try {
      const privateKey = Ed25519PrivateKey.generate();
      const publicKey = privateKey.publicKey();

      return {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Map MetaAddress entity to public DTO (strips private fields)
   */
  private mapToPublicDto(
    metaAddress: MetaAddress,
  ): CreateMetaAddressResponseDto {
    return {
      metaId: metaAddress.metaId,
      scanPublic: metaAddress.scanPublic,
      spendPublic: metaAddress.spendPublic,
      createdAt: metaAddress.createdAt.toISOString(),
    };
  }

  /**
   * Map StealthAddress entity to response DTO
   */
  private mapToStealthAddressDto(
    stealthAddress: StealthAddress,
  ): StealthAddressResponseDto {
    return {
      stealthId: stealthAddress.stealthId,
      address: stealthAddress.address,
      viewTag: stealthAddress.viewTag,
      createdAt: stealthAddress.createdAt.toISOString(),
      metaId: stealthAddress.metaAddress.metaId,
    };
  }

  /**
   * Map Transaction entity to response DTO
   */
  private mapToTransactionDto(
    transaction: Transaction,
  ): TransactionResponseDto {
    return {
      txHash: transaction.txHash,
      timestamp: transaction.timestamp.toISOString(),
      direction: transaction.direction,
      assetType: transaction.assetType,
      tokenAddress: transaction.tokenAddress || null,
      tokenId: transaction.tokenId || null,
      amount: transaction.amount ? transaction.amount.toString() : null,
    };
  }
}
