import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AptosSignatureGuard } from './aptos-signature.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly aptosGuard: AptosSignatureGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication
    const jwtValid = await this.jwtGuard.canActivate(context);
    if (!jwtValid) return false;

    // Then require fresh Aptos signature verification
    const aptosValid = await this.aptosGuard.canActivate(context);
    return aptosValid;
  }
}
