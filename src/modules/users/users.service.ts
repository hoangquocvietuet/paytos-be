import { Injectable } from '@nestjs/common';
import { BaseServiceAbstract } from '../../common/base.service';
import { User } from './users.schema';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService extends BaseServiceAbstract<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }
}
