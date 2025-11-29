/** @type {import('jest').Config} */
module.exports = {
  // Use test-specific babel config to avoid transformation conflicts
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
  rootDir: '.',
  testEnvironment: 'node',
  // Clear all mocks before applying our own to ensure they're not overridden
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-gesture-handler|react-native-reanimated|expo|@expo|@react-three/fiber|@react-three/drei|three|expo-modules-core|expo-secure-store|expo-blur|expo-haptics|expo-location|expo-linear-gradient|expo-font)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Map @/ imports to src/ directory and force mocks for problematic native modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-gesture-handler$': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    // Mock binary assets
    '\\.(wav|mp3|ogg|m4a|aac|flac)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/__tests__/archived/', '/__tests__/integration/'],
  
  // Coverage configuration
  collectCoverage: false, // Disabled by default for fast local runs
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/coverage/',
    '/dist/',
    '/build/',
    '\\.d\\.ts$',
    '\\.snap$',
    '/src/constants/',
    '/src/types/',
    '/.expo/',
    '/android/',
    '/ios/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher thresholds for core UI components
    './src/components/ui/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Lower thresholds for 3D components (heavily mocked)
    './src/components/3d/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Standard thresholds for providers and hooks
    './src/providers/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/hooks/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Map components have complex platform-specific code
    './src/components/map/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
