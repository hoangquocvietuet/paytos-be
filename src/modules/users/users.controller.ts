import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard.js';

import { UpdateUsernameDto, UserResponse } from './users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
