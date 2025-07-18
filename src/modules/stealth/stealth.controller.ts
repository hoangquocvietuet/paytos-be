import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  BalanceResponseDto,
  CreateMetaAddressBodyDto,
  CreateMetaAddressResponseDto,
  DeleteMetaAddressParamsDto,
  GetMetaAddressesQueryDto,
  GetMetaAddressesResponseDto,
  GetStealthAddressBalanceParamsDto,
  GetStealthAddressesQueryDto,
  GetStealthAddressesResponseDto,
  GetStealthAddressParamsDto,
  GetStealthAddressTransactionsParamsDto,
} from './stealth.dto.js';
import { StealthService } from './stealth.service.js';

@ApiTags('Stealth')
@Controller('stealth')
// @UseGuards(JwtAuthGuard)
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
    @Body() body: CreateMetaAddressBodyDto,
  ): Promise<CreateMetaAddressResponseDto> {
    const aptosPublicKey = body.aptosPublicKey;
    const spendPublicKey = body.spendPublicKey;
    const scanPublicKey = body.scanPublicKey;
    const scanPrivateKeyEncrypted = body.scanPrivateKeyEncrypted;
    return await this.stealthService.createMetaAddress(
      aptosPublicKey,
      spendPublicKey,
      {
        publicKey: scanPublicKey,
        scanPrivateKeyEncrypted: scanPrivateKeyEncrypted,
      },
    );
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

  @Get('meta/:username')
  @ApiOperation({
    summary: 'Get Meta-Addresses by Username',
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
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during retrieval',
  })
  async getMetaAddressesByUsername(
    @Param('username') username: string,
  ): Promise<GetMetaAddressesResponseDto> {
    return await this.stealthService.getMetaAddressesByUsername(username);
  }

  @Get('addresses')
  @ApiOperation({
    summary: 'List Stealth Addresses',
    description:
      'List every unique one-time address derived for a user, optionally filtered by meta-address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stealth addresses retrieved successfully',
    type: GetStealthAddressesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during retrieval',
  })
  async getUserStealthAddresses(
    @Request() req,
    @Query() query: GetStealthAddressesQueryDto,
    @Query('aptosPublicKey') aptosPublicKey: string,
    @Query('address') address: string,
  ): Promise<GetStealthAddressesResponseDto> {
    console.log(aptosPublicKey, address, query);
    const res = await this.stealthService.getUserStealthAddresses(
      aptosPublicKey,
      address,
      query,
    );
    console.log(res);
    return res;
  }
}
