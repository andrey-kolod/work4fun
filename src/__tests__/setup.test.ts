// src/__tests__/setup.test.ts

import '@testing-library/jest-dom';

global.fetch = jest.fn();

describe('Basic test setup', () => {
  it('should have fetch mock', () => {
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV TEST] setup.test.ts: fetch замокан успешно');
    }
  });
});
