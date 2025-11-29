import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        projectService: false,
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // RN-specific
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-single-element-style-arrays': 'warn',
      // TS balance: warn on common pitfalls
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['args', 'object', 'attach', 'map', 'specularMap', 'normalMap', 'shininess', 'specular', 'transparent', 'depthWrite', 'blending', 'side', 'frustumCulled', 'sizeAttenuation', 'intensity', 'position', 'castShadow', 'receiveShadow'] }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'error', // Enforce structured logging via utils/logger.ts
      'no-undef': 'off', // TypeScript handles this better
      'react-hooks/purity': 'off', // Three.js geometry generation in useMemo is intentional
      // Disable problematic Reanimated ESLint rules that flag valid worklet functions
      'react-compiler/react-compiler': 'off',
      'react-hooks/immutability': 'off', // SharedValue modifications in worklets are valid in Reanimated 3
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Allow console in logger.ts itself (it's the logging implementation)
    files: ['src/utils/logger.ts', 'src/services/deviceLocationManager.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['__mocks__/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'writable',
        describe: 'writable',
        it: 'writable',
        expect: 'writable',
        beforeEach: 'writable',
        afterEach: 'writable',
        beforeAll: 'writable',
        afterAll: 'writable',
        module: 'writable',
        exports: 'writable',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      '__tests__/**',
      'jest.setup.js',
      'jest.config.js',
      // Keep ESLint in sync with tsconfig excludes to prevent parser errors
      'src/services/receiptGenerator.ts',
      'src/services/safetyService.ts',
      // Hooks currently excluded from tsconfig project
      'src/hooks/useInteractionState.ts',
      'src/hooks/useMagneticInteraction.tsx',
      'src/hooks/useRippleEffect.tsx',
      // Directories under development - not in production build
      'src/components/payment/**',
      'src/components/chat/**',
      'src/components/admin/**',
    ],
  },
];
