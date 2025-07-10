import {
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
  CreateMetaAddressResponseDto,
  DeleteMetaAddressParamsDto,
  GetMetaAddressesQueryDto,
  GetMetaAddressesResponseDto,
  GetStealthAddressesQueryDto,
  GetStealthAddressesResponseDto,
  GetStealthAddressParamsDto,
  GetStealthAddressTransactionsParamsDto,
  StealthAddressResponseDto,
  TransactionResponseDto,
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
  ): Promise<GetStealthAddressesResponseDto> {
    const user = req.user;
    return await this.stealthService.getUserStealthAddresses(
      user.userId,
      query,
    );
  }

  @Get('addresses/:address')
  @ApiOperation({
    summary: 'Get Stealth Address Details',
    description:
      'Fetch metadata about one stealth address (for e.g. showing which meta-address spawned it).',
  })
  @ApiResponse({
    status: 200,
    description: 'Stealth address details retrieved successfully',
    type: StealthAddressResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Stealth address not found or does not belong to user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during retrieval',
  })
  async getStealthAddressByAddress(
    @Request() req,
    @Param() params: GetStealthAddressParamsDto,
  ): Promise<StealthAddressResponseDto> {
    const user = req.user;
    return await this.stealthService.getStealthAddressByAddress(
      user.userId,
      params.address,
    );
  }

  @Get('addresses/:address/transactions')
  @ApiOperation({
    summary: 'Get Stealth Address Transactions',
    description: 'Show the ledger of transfers in/out of a stealth address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Stealth address not found or does not belong to user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during retrieval',
  })
  async getStealthAddressTransactions(
    @Request() req,
    @Param() params: GetStealthAddressTransactionsParamsDto,
  ): Promise<TransactionResponseDto[]> {
    const user = req.user;
    return await this.stealthService.getStealthAddressTransactions(
      user.userId,
      params.address,
    );
  }

  @Delete('meta/:metaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete Meta-Address',
    description:
      "Revoke one of a user's meta-addresses; cleans up its stealth addresses & related data.",
  })
  @ApiResponse({
    status: 204,
    description: 'Meta-address deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Meta-address not found or does not belong to user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during deletion',
  })
  async deleteMetaAddress(
    @Request() req,
    @Param() params: DeleteMetaAddressParamsDto,
  ): Promise<void> {
    const user = req.user;
    await this.stealthService.deleteMetaAddress(user.userId, params.metaId);
  }
}
