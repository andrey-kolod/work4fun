// src/__tests__/lib/audit.test.ts

import audit from '@/lib/audit';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockedCreate = prisma.auditLog.create as jest.MockedFunction<typeof prisma.auditLog.create>;

describe('audit', () => {
  beforeEach(() => {
    mockedCreate.mockClear();

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV TEST] audit.test.ts: Мок prisma.auditLog.create очищен');
    }
  });

  it('should create audit log with request (full data)', async () => {
    const mockRequest = {
      headers: {
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.0.1';
          if (header === 'user-agent') return 'Mozilla/5.0 Test Browser';
          return null;
        }),
      },
    } as unknown as NextRequest;

    const details = { action: 'CREATE', name: 'Test Project' };

    await audit.create('user-123', 'Project', 'proj-456', details, mockRequest);

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        entityType: 'Project',
        entityId: 'proj-456',
        action: 'CREATE',
        details: JSON.stringify(details),
        ipAddress: '192.168.0.1',
        userAgent: 'Mozilla/5.0 Test Browser',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV TEST] audit.test.ts: Тест с request прошёл');
    }
  });

  it('should create audit log without request (default unknown)', async () => {
    const details = { action: 'UPDATE', changes: { old: 'a', new: 'b' } };

    await audit.create('user-789', 'Task', 'task-101', details);

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-789',
        entityType: 'Task',
        entityId: 'task-101',
        action: 'UPDATE',
        details: JSON.stringify(details),
        ipAddress: 'unknown',
        userAgent: 'unknown',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV TEST] audit.test.ts: Тест без request прошёл');
    }
  });

  it('should handle invalid parameters silently (no DB call)', async () => {
    await audit.create('', '', '', {});

    expect(mockedCreate).not.toHaveBeenCalled();

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV TEST] audit.test.ts: Тест на невалидные параметры прошёл');
    }
  });
});
