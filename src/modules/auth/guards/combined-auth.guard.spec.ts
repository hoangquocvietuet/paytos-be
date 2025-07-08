import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AptosSignatureGuard } from './aptos-signature.guard.js';
import { CombinedAuthGuard } from './combined-auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('CombinedAuthGuard', () => {
  let guard: CombinedAuthGuard;
  let jwtGuard: JwtAuthGuard;
  let aptosGuard: AptosSignatureGuard;

  const mockJwtGuard = {
    canActivate: jest.fn(),
  };

  const mockAptosGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombinedAuthGuard,
        {
          provide: JwtAuthGuard,
          useValue: mockJwtGuard,
        },
        {
          provide: AptosSignatureGuard,
          useValue: mockAptosGuard,
        },
      ],
    }).compile();

    guard = module.get<CombinedAuthGuard>(CombinedAuthGuard);
    jwtGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    aptosGuard = module.get<AptosSignatureGuard>(AptosSignatureGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: 'Bearer jwt-token' },
        body: {
          signatureHex: '0xsignature',
          messageHex: 'test message',
          publicKeyHex: '0x1234567890abcdef',
        },
      }),
    }),
  }) as ExecutionContext;

  describe('canActivate', () => {
    it('should return true when both JWT and Aptos signature are valid', async () => {
      mockJwtGuard.canActivate.mockResolvedValue(true);
      mockAptosGuard.canActivate.mockResolvedValue(true);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it('should return false when JWT authentication fails', async () => {
      mockJwtGuard.canActivate.mockResolvedValue(false);
      mockAptosGuard.canActivate.mockResolvedValue(true);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).not.toHaveBeenCalled(); // Should not call if JWT fails
    });

    it('should return false when Aptos signature verification fails', async () => {
      mockJwtGuard.canActivate.mockResolvedValue(true);
      mockAptosGuard.canActivate.mockResolvedValue(false);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it('should return false when both authentications fail', async () => {
      mockJwtGuard.canActivate.mockResolvedValue(false);
      mockAptosGuard.canActivate.mockResolvedValue(false);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).not.toHaveBeenCalled();
    });

    it('should propagate errors from JWT guard', async () => {
      const error = new Error('JWT validation failed');
      mockJwtGuard.canActivate.mockRejectedValue(error);

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(error);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).not.toHaveBeenCalled();
    });

    it('should propagate errors from Aptos guard', async () => {
      const error = new Error('Signature verification failed');
      mockJwtGuard.canActivate.mockResolvedValue(true);
      mockAptosGuard.canActivate.mockRejectedValue(error);

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(error);
      expect(jwtGuard.canActivate).toHaveBeenCalledWith(context);
      expect(aptosGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it('should call guards in correct order (JWT first, then Aptos)', async () => {
      const callOrder: string[] = [];
      
      mockJwtGuard.canActivate.mockImplementation(async () => {
        callOrder.push('jwt');
        return true;
      });
      
      mockAptosGuard.canActivate.mockImplementation(async () => {
        callOrder.push('aptos');
        return true;
      });

      const context = createMockContext();
      await guard.canActivate(context);

      expect(callOrder).toEqual(['jwt', 'aptos']);
    });
  });
}); 