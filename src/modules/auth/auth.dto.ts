import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;
}

export class GetNonceDto {
  @IsString()
  @IsNotEmpty()
  aptosPublicKey: string;
}

export class AuthResponse {
  access_token: string;
  user: {
    userId: string;
    username: string;
    aptosPublicKey: string;
  };
}
