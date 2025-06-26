import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base.repository.js';
import { User } from './users.schema.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }
}
