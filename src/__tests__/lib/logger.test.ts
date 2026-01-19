// src/__tests__/lib/logger.test.ts

describe('Logger', () => {
  // Используем динамический импорт чтобы избежать проблем с окружением
  let log: any;
  let logError: any;

  beforeAll(() => {
    // Импортируем логгер
    const loggerModule = require('@/lib/logger');
    log = loggerModule.log;
    logError = loggerModule.logError;
  });

  test('should have all log methods', () => {
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.fatal).toBe('function');
  });

  test('should have errorWithContext method', () => {
    expect(typeof log.errorWithContext).toBe('function');
  });

  test('should have utility methods', () => {
    expect(typeof log.getConfig).toBe('function');
    expect(typeof log.getLogDir).toBe('function');
    expect(typeof log.getLogFile).toBe('function');
  });

  test('getConfig should return configuration object', () => {
    const config = log.getConfig();

    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
    expect(config).toHaveProperty('level');
    expect(config).toHaveProperty('service');
    expect(config).toHaveProperty('env');
  });

  test('getLogDir should return string', () => {
    const logDir = log.getLogDir();
    expect(typeof logDir).toBe('string');
  });

  test('getLogFile should return string with date', () => {
    const logFile = log.getLogFile();
    expect(typeof logFile).toBe('string');
    // Может содержать дату в формате YYYY-MM-DD
    expect(logFile).toMatch(/.*\.log$/);
  });

  test('log methods should not throw', () => {
    expect(() => log.info('Test message')).not.toThrow();
    expect(() => log.error('Test error')).not.toThrow();
  });

  test('logError should not throw with Error instance', () => {
    const error = new Error('Test error');
    expect(() => logError(error, 'Test context')).not.toThrow();
  });

  test('logError should not throw with string error', () => {
    expect(() => logError('String error', 'Test context')).not.toThrow();
  });
});
