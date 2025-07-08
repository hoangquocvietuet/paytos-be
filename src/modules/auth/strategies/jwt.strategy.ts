import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { env } from '../../../config/index.js';
import { UsersService } from '../../users/users.service.js';

export interface JwtPayload {
  sub: string; // userId
  username: string;
  aptosPublicKey: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        userId: user.userId,
        username: user.username,
        aptosPublicKey: user.aptosPublicKey,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
