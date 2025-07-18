import { Nonce } from '../modules/auth/entities/nonce.entity.js';
import { User } from '../modules/users/entities/user.entity.js';

/**
 * Test data factories for creating mock objects
 */
export class TestDataFactory {
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      aptosPublicKey: '0x1234567890abcdef',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      metaAddresses: [],
      ...overrides,
    };
  }

  static createMockNonce(overrides: Partial<Nonce> = {}): Nonce {
    return {
      id: '123e4567-e89b-12d3-a456-426614174001',
      value: 'test-nonce-value-123',
      aptosPublicKey: '0x1234567890abcdef',
      used: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      ...overrides,
    };
  }

  static createExpiredNonce(overrides: Partial<Nonce> = {}): Nonce {
    return this.createMockNonce({
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      ...overrides,
    });
  }

  static createUsedNonce(overrides: Partial<Nonce> = {}): Nonce {
    return this.createMockNonce({
      used: true,
      ...overrides,
    });
  }
}

/**
 * Common mock implementations for services
 */
export const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
});

export const createMockJwtService = () => ({
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
});

export const createMockUsersService = () => ({
  createUser: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
  findByAptosPublicKey: jest.fn(),
  updateUsername: jest.fn(),
});

export const createMockNonceService = () => ({
  generateNonce: jest.fn(),
  validateAndUseNonce: jest.fn(),
  getNonceMessage: jest.fn(),
});

export const createMockAuthService = () => ({
  generateNonce: jest.fn(),
  register: jest.fn(),
  login: jest.fn(),
});

/**
 * Mock Aptos SDK components
 */
export const createMockAptosPublicKey = () => ({
  verifySignatureAsync: jest.fn(),
});

export const createMockAptosSignature = () => ({});

/**
 * Test environment utilities
 */
export class TestEnvironment {
  static setupJestMocks() {
    // Mock console methods to reduce noise in tests
    const originalConsole = global.console;
    beforeEach(() => {
      global.console = {
        ...originalConsole,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
    });

    afterEach(() => {
      global.console = originalConsole;
    });
  }

  static async waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static expectToHaveBeenCalledWith<T extends (...args: any[]) => any>(
    mockFn: jest.MockedFunction<T>,
    expectedArgs: Parameters<T>,
  ) {
    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
  }
}

/**
 * Common test assertions
 */
export class TestAssertions {
  static expectValidUuid(value: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(value).toMatch(uuidRegex);
  }

  static expectValidJwtToken(token: string) {
    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBeTruthy(); // header
    expect(parts[1]).toBeTruthy(); // payload
    expect(parts[2]).toBeTruthy(); // signature
  }

  static expectValidAptosPublicKey(key: string) {
    expect(key).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(key.length).toBeGreaterThanOrEqual(66); // 0x + 64 hex chars minimum
  }

  static expectValidNonce(nonce: string) {
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  }

  static expectAuthResponse(response: any) {
    expect(response).toHaveProperty('access_token');
    expect(response).toHaveProperty('user');
    expect(response.user).toHaveProperty('userId');
    expect(response.user).toHaveProperty('username');
    expect(response.user).toHaveProperty('aptosPublicKey');
    expect(response.user).toHaveProperty('spendPublicKey');
    this.expectValidJwtToken(response.access_token);
    this.expectValidUuid(response.user.userId);
    this.expectValidAptosPublicKey(response.user.aptosPublicKey);
    this.expectValidAptosPublicKey(response.user.spendPublicKey);
  }
}
