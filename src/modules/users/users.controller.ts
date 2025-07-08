import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUsernameDto,
} from './users.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public route - no authentication required
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  // Standard JWT auth - normal operations
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  // New profile update endpoint - JWT auth only
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.userId; // Extract userId from JWT token
    return await this.usersService.updateProfile(
      userId,
      updateProfileDto.username,
    );
  }

  // High security - requires both JWT + fresh signature
  @UseGuards(CombinedAuthGuard)
  @Put('username')
  async updateUsername(@Body() updateUsernameDto: UpdateUsernameDto) {
    return await this.usersService.updateUsername(updateUsernameDto);
  }
}
