import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from './entities/user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async findById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userId },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async findByAptosPublicKey(aptosPublicKey: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { aptosPublicKey },
    });
  }

  async update(userId: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(userId, updateData);
    return await this.findById(userId);
  }

  async delete(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
}
