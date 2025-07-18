import { Body, Controller, Post } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { EncryptionService } from './encryption.service.js';

class EncryptBodyDto {
  @ApiProperty({
    description: 'Text to encrypt',
    example: 'Hello, world!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

class DecryptBodyDto {
  @ApiProperty({
    description: 'Text to decrypt',
    example: 'Hello, world!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

class EncryptResponseDto {
  @ApiProperty({
    description: 'Encrypted text',
    example: 'e6d39dcb55a1b2c3d4e5f6789abcdef0:1234567890abcdef',
  })
  encrypted: string;
}

class DecryptResponseDto {
  @ApiProperty({
    description: 'Decrypted text',
    example: 'Hello, world!',
  })
  decrypted: string;
}

@Controller('encryption')
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('encrypt')
  @ApiResponse({
    status: 200,
    description: 'Text encrypted successfully',
    type: EncryptResponseDto,
  })
  async encrypt(@Body() body: EncryptBodyDto): Promise<EncryptResponseDto> {
    const encrypted = await this.encryptionService.encrypt(body.text);
    return { encrypted };
  }

  @Post('decrypt')
  @ApiResponse({
    status: 200,
    description: 'Text decrypted successfully',
    type: DecryptResponseDto,
  })
  async decrypt(@Body() body: DecryptBodyDto): Promise<DecryptResponseDto> {
    const decrypted = await this.encryptionService.decrypt(body.text);
    return { decrypted };
  }
}
