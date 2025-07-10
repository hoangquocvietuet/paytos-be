import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { Repository } from 'typeorm';

import { EncryptionService } from '../../common/encryption.service.js';
import { User } from '../users/entities/user.entity.js';

import { MetaAddress } from './entities/meta-address.entity.js';
import {
  CreateMetaAddressResponseDto,
  GetMetaAddressesQueryDto,
  GetMetaAddressesResponseDto,
} from './stealth.dto.js';

@Injectable()
export class StealthService {
  constructor(
    @InjectRepository(MetaAddress)
    private readonly metaAddressRepository: Repository<MetaAddress>,
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
}
