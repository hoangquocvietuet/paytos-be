require('reflect-metadata');

// Mock console methods to reduce noise in tests unless explicitly needed
const originalConsole = global.console;

beforeEach(() => {
  // Only mock if not already mocked in individual tests
  if (!jest.isMockFunction(console.log)) {
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
  }
});

afterEach(() => {
  // Restore original console
  global.console = originalConsole;

  // Clear all mocks
  jest.clearAllMocks();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_paytos';

// Global timeout for async operations in tests
jest.setTimeout(10000);

// Mock Aptos SDK globally for all tests
jest.mock('@aptos-labs/ts-sdk', () => ({
  AptosConfig: jest.fn().mockImplementation(() => ({})),
  Network: { TESTNET: 'testnet', MAINNET: 'mainnet' },
  deserializePublicKey: jest.fn(),
  deserializeSignature: jest.fn(),
}));

// Helper to suppress console output for specific tests
global.suppressConsole = () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
};

// Helper to restore console output
global.restoreConsole = () => {
  afterEach(() => {
    console.log.mockRestore?.();
    console.warn.mockRestore?.();
    console.error.mockRestore?.();
  });
};
