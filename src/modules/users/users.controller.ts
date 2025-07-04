import { Body, Controller, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUsernameDto } from './users.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put('username')
  async updateUsername(@Body() updateUsernameDto: UpdateUsernameDto) {
    return this.usersService.updateUsername(updateUsernameDto);
  }

  @Post('public-key')
  async getUserByPublicKey(@Body() body: { publicKey: string }) {
    return this.usersService.getUserByPublicKey(body.publicKey);
  }
}
