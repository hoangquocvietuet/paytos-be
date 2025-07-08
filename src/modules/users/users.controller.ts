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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUsernameDto,
  UserResponse,
} from './users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Create new user',
    description:
      'Creates a new user account. This is a public endpoint that does not require authentication.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponse,
  })
  @ApiBadRequestResponse({
    description: 'Username already exists or invalid input data',
  })
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves user information by user ID. Requires JWT authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID format)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: UserResponse,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token missing or invalid',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Updates the username of the currently authenticated user. User ID is extracted from JWT token.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponse,
  })
  @ApiBadRequestResponse({
    description: 'Username already exists or invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token missing or invalid',
  })
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

  @ApiOperation({
    summary: 'Update username (high security)',
    description:
      'Updates username with enhanced security requiring both JWT token and fresh Aptos signature verification.',
  })
  @ApiBody({ type: UpdateUsernameDto })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Username updated successfully',
    type: UserResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Username already exists, invalid signature, or invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT token missing/invalid or signature verification failed',
  })
  @UseGuards(CombinedAuthGuard)
  @Put('username')
  async updateUsername(@Body() updateUsernameDto: UpdateUsernameDto) {
    return await this.usersService.updateUsername(updateUsernameDto);
  }
}
