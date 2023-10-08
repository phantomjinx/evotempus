module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    semi: ['error', 'never'],
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      {
        accessibility: 'no-public',
      },
    ],
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        allow: ['constructors'],
      },
    ],
    '@typescript-eslint/no-redeclare': 'off',
    'import/no-default-export': 'error'
  },
  root: true,
}
