import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AptosConfig,
  deserializePublicKey,
  deserializeSignature,
  Network,
} from '@aptos-labs/ts-sdk';

interface AptosSignatureBody {
  signatureHex: string;
  messageHex: string;
  publicKeyHex: string;
}

@Injectable()
export class AptosSignatureGuard implements CanActivate {
  private readonly aptosConfig: AptosConfig;

  constructor() {
    this.aptosConfig = new AptosConfig({
      network: Network.TESTNET,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body as AptosSignatureBody;

    const { signatureHex, messageHex, publicKeyHex } = body;

    if (!signatureHex || !messageHex || !publicKeyHex) {
      throw new UnauthorizedException(
        'Missing signature, public key, or message',
      );
    }

    try {
      const publicKey = deserializePublicKey(publicKeyHex);
      const signature = deserializeSignature(signatureHex);

      const isValid = await publicKey.verifySignatureAsync({
        aptosConfig: this.aptosConfig,
        message: messageHex,
        signature,
        options: {
          throwErrorWithReason: true,
        },
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }
}
