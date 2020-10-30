module.exports = {
  env: {
    es6: true,
    browser: true
  },
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: { // See https://eslint.org/docs/rules/
    // Additional rules:
    'no-console': 'error',
    'eqeqeq': 'error',
    'no-return-await': 'error',

    // Disabled rules:
    'prefer-const': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',

    // Rules to be enabled:
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'no-extra-boolean-cast': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',

    // Rules to be discussed:
    'prefer-spread': 'off',
    'no-async-promise-executor': 'off',
    'no-case-declarations': 'off',
    'no-fallthrough': 'off',
    'no-inner-declarations': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
  }
};
