import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      '*.log',
      '.env*',
      '.vite/',
      '.svelte-kit/',
      'test-results/',
      'playwright-report/',
      'playwright/.cache/',
      'specs/'
    ]
  },
  js.configs.recommended,
  {
    // Node.js config files
    files: ['*.config.ts', '*.config.js', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        Storage: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule for TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    // Svelte rune files (.svelte.ts)
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        // Svelte 5 runes
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule for TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'error',
      'complexity': ['warn', 15],
      'max-depth': ['warn', 6],
      'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    // Browser TypeScript files (non-Svelte)
    files: ['src/**/*.ts', '!**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule for TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'error',
      'complexity': ['warn', 15],
      'max-depth': ['warn', 6],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    // Svelte components
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser
      },
      globals: {
        ...globals.browser,
        // Svelte 5 runes
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly'
      }
    },
    plugins: {
      svelte
    },
    rules: {
      'svelte/no-unused-svelte-ignore': 'error',
      'svelte/valid-compile': 'error',
      'no-unused-vars': 'off',
      'no-undef': 'error'
    }
  },
  {
    // Test files - unit tests
    files: ['tests/unit/**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        // Vitest/Testing globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        Storage: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule for TypeScript
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions with test fixtures
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in tests for debugging
      'max-lines-per-function': ['warn', { max: 500, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    // Test files - e2e tests
    files: ['tests/e2e/**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        // Playwright globals
        test: 'readonly',
        expect: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule for TypeScript
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions in e2e tests
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in tests for debugging
      'max-lines-per-function': 'off' // E2E tests can be longer
    }
  }
];
