import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import testingLibraryPlugin from 'eslint-plugin-testing-library'
import importPlugin from 'eslint-plugin-import'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Base Recommended Configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Application Config
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],

    ignores: ["build/*", "node_modules/*", "public/*"],

    // Replaces 'env: browser' and 'parserOptions'
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    // Replaces the old 'settings' block for React
    settings: {
      react: { version: 'detect' },
    },

    // Replaces the old 'plugins: [...]' array
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },

    // Merging Plugin Rules & Your Custom Overrides
    rules: {
      // Pull in the recommended rules from 'extends'
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // overrides
      'react/react-in-jsx-scope': 'off',
      semi: ['error', 'never'],
      '@typescript-eslint/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@typescript-eslint/no-redeclare': 'off',
      'import/no-default-export': 'error',
      'react/prop-types': 'off',
    },
  },

  // Testing Library Scoped Config
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      ...testingLibraryPlugin.configs.react.rules,
      'testing-library/no-debugging-utils': ['warn', { utilsToCheckFor: { debug: false } }],
    },
  },

  // Node-specific files (Jest mocks, Webpack configs, etc.)
  {
    files: [
      'src/__mocks__/**/*.js',
      '*.config.js',
      '*.config.mjs'
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier MUST stay at the very bottom to override styling rules
  prettierConfig
)
