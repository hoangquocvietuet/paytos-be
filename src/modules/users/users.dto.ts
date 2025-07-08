import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  publicKeyHex: string;

  @IsString()
  @IsNotEmpty()
  sendPublicKey: string;

  @IsString()
  @IsNotEmpty()
  viewPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  viewPublicKey: string;
}

export class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty()
  oldUsername: string;

  @IsString()
  @IsNotEmpty()
  newUsername: string;
}
