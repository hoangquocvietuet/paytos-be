import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Ed25519PrivateKey,
  PublicKey,
  Secp256k1PublicKey,
  Serializer,
} from '@aptos-labs/ts-sdk';
import { Repository } from 'typeorm';

import { EncryptionService } from '../encryption/encryption.service.js';
import { User } from '../users/entities/user.entity.js';

import { MetaAddress } from './entities/meta-address.entity.js';
import { StealthAddress } from './entities/stealth-address.entity.js';
import {
  AssetType,
  Direction,
  Transaction,
} from './entities/transaction.entity.js';
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
import { Cron, CronExpression } from '@nestjs/schedule';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';
import { sha256 } from '@noble/hashes/sha2';
import { sha3_256 } from '@noble/hashes/sha3';

const aptos = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    clientConfig: { API_KEY: process.env.APTOS_API_KEY },
  }),
);

const publicKeyToAddress = (publicKey: string) => {
  const stealthPubBytes = hexToBytes(publicKey); // compressed 33-byte pubkey
  const prefix = new Uint8Array([0x01]);
  const scheme = new Uint8Array([0x02]);
  const concat = new Uint8Array(
    prefix.length + stealthPubBytes.length + scheme.length,
  );
  concat.set(prefix, 0);
  concat.set(stealthPubBytes, 1);
  concat.set(scheme, 1 + stealthPubBytes.length);

  const stealthAddressBytes = sha3_256(concat);
  const stealthAddress = `0x${bytesToHex(stealthAddressBytes)}`;
  return stealthAddress;
};

@Injectable()
export class StealthService {
  constructor(
    @InjectRepository(MetaAddress)
    private readonly metaAddressRepository: Repository<MetaAddress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StealthAddress)
    private readonly stealthAddressRepository: Repository<StealthAddress>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new stealth meta-address with scan/spend keypairs
   */
  async createMetaAddress(
    aptosPublicKey: string,
    spendPublicKey: string,
    scanKeyPair: { scanPrivateKeyEncrypted: string; publicKey: string },
  ): Promise<CreateMetaAddressResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { aptosPublicKey },
      });

      if (!user) {
        throw new InternalServerErrorException(
          'User not found, please create an account first',
        );
      }

      // Create and save meta-address entity
      const metaAddress = this.metaAddressRepository.create({
        user,
        scanPublic: scanKeyPair.publicKey,
        spendPublic: spendPublicKey,
        scanPrivateEncrypted: scanKeyPair.scanPrivateKeyEncrypted,
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

  async getMetaAddressesByUsername(
    username: string,
  ): Promise<GetMetaAddressesResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { username } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      console.log(user);

      const metaAddresses = await this.metaAddressRepository.find({
        where: { user: { userId: user.userId } },
      });

      console.log(metaAddresses);

      return {
        data: metaAddresses.map((metaAddress) =>
          this.mapToPublicDto(metaAddress),
        ),
        meta: {
          page: 1,
          limit: metaAddresses.length,
          total: metaAddresses.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve meta-addresses: ${error.message}`,
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
    aptosPublicKey: string,
    address: string,
    query: GetStealthAddressesQueryDto,
  ): Promise<any> {
    console.log('aptosPublicKey', aptosPublicKey);
    console.log('address', address);

    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const user = await this.userRepository.findOne({
        where: { aptosPublicKey },
      });

      console.log('user', user);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const tranasctions = await this.transactionRepository.find({
        where: {
          user_id: user.userId,
        },
        order: { transaction_block_height: 'DESC' }, // Most recent first
        skip,
        take: limit,
      });
      // Compress the public key if it's uncompressed
      const tranasctions2 = await this.transactionRepository.find({
        where: {
          sender_address: address,
        },
        order: { transaction_block_height: 'DESC' }, // Most recent first
        skip,
        take: limit,
      });

      tranasctions.push(...tranasctions2);

      console.log(tranasctions2);

      const total = tranasctions.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: tranasctions.map((transaction) =>
          this.mapToTransactionDto(transaction, address),
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
        where: {},
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
        where: {
          user_id: userId,
        },
        order: { transaction_block_height: 'DESC' }, // Most recent first
        select: [
          'event_index',
          'transaction_block_height',
          'direction',
          'amount',
        ],
      });

      return transactions.map((transaction) =>
        this.mapToTransactionDto(transaction, address),
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
    address: string,
  ): TransactionResponseDto {
    return {
      stealthAddress: transaction.stealth_address,
      direction:
        address === transaction.sender_address ? Direction.OUT : Direction.IN,
      amount: transaction.amount,
    };
  }

  private async recoverPrivateKey(ephemeralPublicKey: string, address: string) {
    for (const metaAddress of await this.metaAddressRepository.find({
      relations: ['user'],
    })) {
      const scanPrivateKey = await this.encryptionService.decrypt(
        metaAddress.scanPrivateEncrypted,
      );
      const rawHex = ephemeralPublicKey.slice(6);

      const scanPoint = secp256k1.Point.fromHex(rawHex);
      const scanCompressedHex = bytesToHex(scanPoint.toBytes(true));

      const sharedSecretPoint = secp256k1.getSharedSecret(
        scanPrivateKey,
        scanCompressedHex,
        true, // compressed
      );
      const sharedSecret = sha256(sharedSecretPoint.slice(1)); // remove prefix (0x04)
      const tweak = BigInt('0x' + bytesToHex(sharedSecret)) % secp256k1.CURVE.n;

      const A = secp256k1.Point.fromHex(metaAddress.spendPublic.slice(6));
      const stealthPub = A.add(secp256k1.Point.BASE.multiply(tweak));
      const stealthPubHex = bytesToHex(stealthPub.toBytes(true)); // compressed

      const stealthAddress = publicKeyToAddress(stealthPubHex);

      if (stealthAddress === address) {
        return metaAddress.user.userId;
      }
    }
    return false;
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const events = await aptos.getModuleEventsByEventType({
      eventType:
        '0xb6b406e564795b8f58ba42dd79c81a3c17e906f37638c4f83bda7d846c675ec7::payment::SentEvent<0x1::fungible_asset::Metadata>',
    });
    for (const event of events) {
      const { sender, receiver, ephemeral_public_key } = event.data;
      try {
        console.log(event.data);
        const tx = await this.transactionRepository.findOne({
          where: {
            event_index: event.event_index,
            transaction_block_height: event.transaction_block_height,
          },
        });
        if (tx) {
          continue;
        }
        const isRecovered = await this.recoverPrivateKey(
          ephemeral_public_key,
          receiver,
        );
        if (isRecovered !== false) {
          await this.transactionRepository.insert({
            user_id: isRecovered,
            sender_address: sender,
            stealth_address: receiver,
            event_index: event.event_index,
            transaction_block_height: event.transaction_block_height,
            direction: Direction.IN,
            amount: event.data.value,
          });
          console.log('transaction inserted');
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}
