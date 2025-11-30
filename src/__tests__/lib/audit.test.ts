// __tests__/lib/audit.test.ts
import { audit, logActivity } from '@/lib/audit';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log activity', async () => {
    const activityData = {
      userId: 1,
      actionType: 'TEST_ACTION',
      entityType: 'Test',
      entityId: 1,
      oldValues: { name: 'old' },
      newValues: { name: 'new' },
      ipAddress: 'unknown', // ДОБАВЛЕНО
      userAgent: 'unknown', // ДОБАВЛЕНО
    };

    await logActivity(activityData);

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: activityData,
    });
  });

  it('should create user with audit.create', async () => {
    await audit.create(1, 'User', 1, { name: 'Test' });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'USER_CREATED',
        entityType: 'User',
        entityId: 1,
        userId: 1,
        newValues: { name: 'Test' },
        ipAddress: 'unknown',
        userAgent: 'unknown',
      }),
    });
  });

  it('should update user with audit.update', async () => {
    await audit.update(1, 'User', 1, { name: 'Old' }, { name: 'New' });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'USER_UPDATED',
        entityType: 'User',
        entityId: 1,
        userId: 1,
        oldValues: { name: 'Old' },
        newValues: { name: 'New' },
        ipAddress: 'unknown',
        userAgent: 'unknown',
      }),
    });
  });
});
