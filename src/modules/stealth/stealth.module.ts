import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EncryptionService } from '../encryption/encryption.service.js';
import { AuthModule } from '../auth/auth.module.js';

import { EphemeralKey } from './entities/ephemeral-key.entity.js';
import { MetaAddress } from './entities/meta-address.entity.js';
import { StealthAddress } from './entities/stealth-address.entity.js';
import { Transaction } from './entities/transaction.entity.js';
import { StealthController } from './stealth.controller.js';
import { StealthService } from './stealth.service.js';
import { User } from '../users/entities/user.entity.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetaAddress,
      StealthAddress,
      EphemeralKey,
      Transaction,
      User,
    ]),
    forwardRef(() => AuthModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [StealthController],
  providers: [StealthService, EncryptionService],
  exports: [StealthService, EncryptionService],
})
export class StealthModule {}
