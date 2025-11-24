// import { defineConfig, globalIgnores } from 'eslint/config';
// import nextVitals from 'eslint-config-next/core-web-vitals';
// import nextTs from 'eslint-config-next/typescript';

// const eslintConfig = defineConfig([
//   ...nextVitals,
//   ...nextTs,
//   // Override default ignores of eslint-config-next.
//   globalIgnores([
//     // Default ignores of eslint-config-next:
//     '.next/**',
//     'out/**',
//     'build/**',
//     'next-env.d.ts',
//   ]),
// ]);

// export default eslintConfig;

import next from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

export default [
  ...next,
  prettier,
  {
    rules: {
      'prefer-const': 'warn',
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
