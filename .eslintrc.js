module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    es2017: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],
  ignorePatterns: ['lib'],
  rules: {
    'no-undef': 2,
    '@typescript-eslint/explicit-function-return-type': { allowExpressions: true },
  },
  overrides: [{ files: ['src/**/*.spec.ts'], env: { mocha: true } }],
};
