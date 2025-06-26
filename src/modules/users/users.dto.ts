import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  sendPublicKey: string;
}

export class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty()
  oldUsername: string;

  @IsString()
  @IsNotEmpty()
  newUsername: string;
}


