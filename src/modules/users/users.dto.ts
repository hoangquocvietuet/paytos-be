import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;
}

export class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

// New DTO for profile updates - only requires username since userId comes from JWT
export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}
