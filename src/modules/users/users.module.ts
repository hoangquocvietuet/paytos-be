import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users.controller.js';
import { UserRepository } from './users.repository.js';
import { User, UserSchema } from './users.schema.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [Logger, UserRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
