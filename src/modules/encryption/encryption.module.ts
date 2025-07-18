import { Module } from '@nestjs/common';

import { EncryptionController } from './encryption.controller.js';
import { EncryptionService } from './encryption.service.js';

@Module({
  controllers: [EncryptionController],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
