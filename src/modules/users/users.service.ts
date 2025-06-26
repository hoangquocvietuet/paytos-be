import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseServiceAbstract } from '../../common/base.service';
import { User } from './users.schema';
import { UserRepository } from './users.repository';
import { CreateUserDto, UpdateUsernameDto } from './users.dto';
import { SingleKeyAccount } from '@aptos-labs/ts-sdk';

@Injectable()
export class UsersService extends BaseServiceAbstract<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  async createUser(createUserDto: CreateUserDto) {
    const { username, sendPublicKey } = createUserDto;

    const existingUserWithSendPublicKey =
      await this.userRepository.findOneByCondition({
        sendPublicKey,
      });

    if (existingUserWithSendPublicKey) {
      throw new BadRequestException(
        `User with send public key ${sendPublicKey} already exists`,
      );
    }

    const existingUsername = await this.userRepository.findOneByCondition({
      username,
    });

    if (existingUsername) {
      throw new BadRequestException(
        `User with username ${username} already exists`,
      );
    }

    const account = SingleKeyAccount.generate();
    const user = {
      username,
      sendPublicKey,
      viewPrivateKey: account.privateKey,
      viewPublicKey: account.publicKey,
    };
    await this.userRepository.create(user);
    return {
      viewPublicKey: account.publicKey,
    };
  }

  async updateUsername(updateUsernameDto: UpdateUsernameDto) {
    const { oldUsername, newUsername } = updateUsernameDto;
    const user = await this.userRepository.findOneByCondition({
      username: oldUsername,
    });
    if (!user) {
      throw new NotFoundException(
        `User with username ${oldUsername} not found`,
      );
    }
    user.username = newUsername;
    await this.userRepository.update(user._id, user);
    return user;
  }

  async getUserByPublicKey(publicKey: string) {
    const user = await this.userRepository.findOneByCondition({
      viewPublicKey: publicKey,
    });
    if (!user) {
      throw new NotFoundException(
        `User with public key ${publicKey} not found`,
      );
    }
    return user;
  }
}
