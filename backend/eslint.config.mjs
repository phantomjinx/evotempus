import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Base Recommended Configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend Application Config
  {
    // Target backend source files (adjust if your backend uses a different structure)
    files: ['**/*.ts', '**/*.js'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },

    plugins: {
      import: importPlugin,
    },

    // Custom Overrides
    rules: {
      semi: ['error', 'never'],
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        { accessibility: 'no-public' },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['constructors'] },
      ],
      '@typescript-eslint/no-redeclare': 'off',
      'import/no-default-export': 'error',
    },
  },

  // Prettier MUST stay at the very bottom
  prettierConfig
)
