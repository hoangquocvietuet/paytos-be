import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Buffer } from 'buffer';
import nacl from 'tweetnacl';
import {
  AnyPublicKey,
  AnySignature,
  AptosConfig,
  deserializePublicKey,
  Deserializer,
  deserializeSignature,
  Network,
} from '@aptos-labs/ts-sdk';

@Injectable()
export class AptosSignatureMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const body = req.body;
    const signatureHex = body.signatureHex;
    const messageHex = body.messageHex;
    const publicKeyHex = body.publicKeyHex;

    if (!signatureHex || !messageHex || !publicKeyHex) {
      throw new UnauthorizedException(
        'Missing signature, public key, or message',
      );
    }
    try {
      const publicKey = deserializePublicKey(publicKeyHex);
      const signature = deserializeSignature(signatureHex);
      const valid = await publicKey.verifySignatureAsync({
        aptosConfig: new AptosConfig({
          network: Network.TESTNET,
        }),
        message: messageHex,
        signature,
        options: {
          throwErrorWithReason: true,
        },
      });
      if (!valid) {
        throw new UnauthorizedException('Invalid signature');
      }
      next();
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Signature verification failed');
    }
  }
}
