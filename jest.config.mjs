export default {
  // Basic setup
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',

  // File patterns
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
        },
      },
    ],
  },

  // Module resolution
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Coverage settings
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/node_modules/**',
    '!**/migrations/**',
    '!**/test-utils/**',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Test setup
  setupFilesAfterEnv: ['<rootDir>/test-utils/jest.setup.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/migrations/'],

  // Verbose output for debugging
  verbose: true,
};
