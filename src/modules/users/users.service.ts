import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from './entities/user.entity.js';
import { CreateUserDto, UpdateUsernameDto } from './users.dto.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, aptosPublicKey } = createUserDto;

    // Check if user with same username exists
    const existingUserByUsername =
      await this.usersRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new BadRequestException(
        `User with username ${username} already exists`,
      );
    }

    // Check if user with same Aptos public key exists
    const existingUserByKey =
      await this.usersRepository.findByAptosPublicKey(aptosPublicKey);
    if (existingUserByKey) {
      throw new BadRequestException(
        `User with Aptos public key already exists`,
      );
    }

    return await this.usersRepository.create({
      username,
      aptosPublicKey,
    });
  }

  async findById(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async findByAptosPublicKey(aptosPublicKey: string): Promise<User> {
    const user =
      await this.usersRepository.findByAptosPublicKey(aptosPublicKey);
    if (!user) {
      throw new NotFoundException(`User with Aptos public key not found`);
    }
    return user;
  }

  async updateUsername(updateUsernameDto: UpdateUsernameDto): Promise<User> {
    const { userId, username } = updateUsernameDto;

    // Check if user exists
    await this.findById(userId);

    // Check if new username is already taken
    const existingUserWithUsername =
      await this.usersRepository.findByUsername(username);
    if (
      existingUserWithUsername &&
      existingUserWithUsername.userId !== userId
    ) {
      throw new BadRequestException(`Username ${username} is already taken`);
    }

    return await this.usersRepository.update(userId, { username });
  }

  // New method for profile updates
  async updateProfile(
    userId: string,
    username: string,
  ): Promise<{ username: string; updatedAt: Date }> {
    // Check if user exists
    await this.findById(userId);

    // Check if new username is already taken
    const existingUserWithUsername =
      await this.usersRepository.findByUsername(username);
    if (
      existingUserWithUsername &&
      existingUserWithUsername.userId !== userId
    ) {
      throw new BadRequestException(`Username ${username} is already taken`);
    }

    const updatedUser = await this.usersRepository.update(userId, { username });

    return {
      username: updatedUser.username,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
