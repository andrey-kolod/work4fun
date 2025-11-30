// __tests__/setup.test.ts
describe('Basic test setup', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have fetch mock', () => {
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
  });
});
