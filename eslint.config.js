const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier');

const browserGlobals = {
  console: 'readonly',
  window: 'readonly',
  document: 'readonly',
  self: 'readonly',
  globalThis: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  sessionStorage: 'readonly',
};

const jestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  jest: 'readonly',
};

module.exports = [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'eslint.config.js',
      'jest.config.ts',
      'setup-jest.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.spec.json', './tsconfig.e2e.json'],
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: jestGlobals,
    },
  },
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      // `process` para playwright.config.ts (Node); el resto de globals de
      // navegador son necesarios porque `page.evaluate(() => ...)` recibe
      // callbacks que se ejecutan dentro de la página (no en Node) y usan
      // `window`/`document`/`performance` directamente.
      globals: { ...browserGlobals, process: 'readonly', performance: 'readonly' },
    },
  },
  {
    files: ['src/app/infrastructure/logger/logger.service.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig,
];
