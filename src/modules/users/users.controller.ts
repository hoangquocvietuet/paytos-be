import { Body, Controller, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'; // Use simple JWT guard

import { UpdateUsernameDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update Username',
    description: 'Updates username with JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Username updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or username already exists',
  })
  async updateUsername(
    @Request() req,
    @Body() updateUsernameDto: UpdateUsernameDto,
  ) {
    const user = req.user;
    return await this.usersService.updateUsername(
      user.userId,
      updateUsernameDto.username,
    );
  }
}
