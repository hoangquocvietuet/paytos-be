import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import {
  CreateMetaAddressResponseDto,
  GetMetaAddressesQueryDto,
  GetMetaAddressesResponseDto,
} from './stealth.dto.js';
import { StealthService } from './stealth.service.js';

@ApiTags('Stealth')
@Controller('stealth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StealthController {
  constructor(private readonly stealthService: StealthService) {}

  @Post('meta')
  @ApiOperation({
    summary: 'Create Meta-Address',
    description:
      'Generate a new stealth "meta-address" (scan/view + spend keypair), encrypt the private material, and store it.',
  })
  @ApiResponse({
    status: 201,
    description: 'Meta-address created successfully',
    type: CreateMetaAddressResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during meta-address creation',
  })
  async createMetaAddress(
    @Request() req,
  ): Promise<CreateMetaAddressResponseDto> {
    const user = req.user;
    return await this.stealthService.createMetaAddress(user);
  }

  @Get('meta')
  @ApiOperation({
    summary: 'Get User Meta-Addresses',
    description:
      'Show all meta-addresses (scan/spend public keys) that a user has generated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Meta-addresses retrieved successfully',
    type: GetMetaAddressesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during retrieval',
  })
  async getUserMetaAddresses(
    @Request() req,
    @Query() query: GetMetaAddressesQueryDto,
  ): Promise<GetMetaAddressesResponseDto> {
    const user = req.user;
    return await this.stealthService.getUserMetaAddresses(user.userId, query);
  }
}
