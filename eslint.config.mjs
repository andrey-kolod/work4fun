// eslint.config.mjs

import next from 'eslint-config-next';

export default [
  ...next,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // ВСЕ правила как предупреждения или отключены
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];
