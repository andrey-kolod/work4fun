// /lib/services/userService.ts

import { prisma } from '@/lib/db';
import { ActivityLogService } from './activityLogService';
import { NextRequest } from 'next/server';

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  projectIds?: number[];
  groupIds?: number[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive?: boolean;
  projectIds?: number[];
  groupIds?: number[];
}

export class UserService {
  private activityLogService: ActivityLogService;

  constructor() {
    this.activityLogService = new ActivityLogService();
  }

  async getAllUsers(projectId?: number, currentUserRole?: string) {
    let whereClause: any = {};

    if (projectId) {
      whereClause = {
        userProjects: {
          some: {
            projectId: projectId,
          },
        },
      };
    }

    if (currentUserRole === 'ADMIN' && projectId) {
      whereClause = {
        ...whereClause,
        userProjects: {
          some: {
            projectId: projectId,
          },
        },
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        userGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users;
  }

  async getUserById(id: number, currentUserRole?: string, currentProjectId?: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userProjects: {
          include: {
            project: true,
          },
        },
        userGroups: {
          include: {
            group: {
              include: {
                project: true,
              },
            },
          },
        },
        assignedTasks: {
          include: {
            task: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (currentUserRole === 'ADMIN' && currentProjectId) {
      const hasAccess = user?.userProjects.some((up) => up.projectId === currentProjectId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }
    }

    return user;
  }

  async createUser(data: CreateUserData, createById: number, request?: NextRequest) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'USER',
        isActive: true,
      },
    });

    if (data.projectIds && data.projectIds.length > 0) {
      await prisma.userProject.createMany({
        data: data.projectIds.map((projectId) => ({
          userId: user.id,
          projectId: projectId,
        })),
      });
    }

    if (data.groupIds && data.groupIds.length > 0) {
      await prisma.userGroup.createMany({
        data: data.groupIds.map((groupId) => ({
          userId: user.id,
          groupId: groupId,
        })),
      });
    }

    await this.activityLogService.logUserAction(
      createById,
      'USER_CREATED',
      'User',
      user.id,
      request,
      {
        email: user.email,
        role: user.role,
        projects: data.projectIds,
        groups: data.groupIds,
      },
    );
    return user;
  }

  async updateUser(id: number, data: UpdateUserData, updatedById: number, request?: NextRequest) {
    const oldUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userProjects: true,
        userGroups: true,
      },
    });

    if (!oldUser) {
      throw new Error('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
      },
    });

    if (data.projectIds) {
      await prisma.userProject.deleteMany({
        where: { userId: id },
      });

      if (data.projectIds.length > 0) {
        await prisma.userProject.createMany({
          data: data.projectIds.map((projectId) => ({
            userId: user.id,
            projectId: projectId,
          })),
        });
      }
    }

    if (data.groupIds) {
      await prisma.userGroup.deleteMany({
        where: { userId: id },
      });

      if (data.groupIds.length > 0) {
        await prisma.userGroup.createMany({
          data: data.groupIds.map((groupId) => ({
            userId: id,
            groupId: groupId,
          })),
        });
      }
    }

    await this.activityLogService.logUserAction(
      updatedById,
      'USER_UPDATED',
      'User',
      user.id,
      request,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
        projects: data.projectIds,
        groups: data.groupIds,
      },
      {
        firstName: oldUser.firstName,
        lastName: oldUser.lastName,
        role: oldUser.role,
        isActive: oldUser.isActive,
        projects: oldUser.userProjects.map((up) => up.projectId),
        groups: oldUser.userGroups.map((ug) => ug.groupId),
      },
    );

    return user;
  }

  async deactivateUser(
    id: number,
    deactivatedById: number,
    reason?: string,
    request?: NextRequest,
  ) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.activityLogService.logUserAction(
      deactivatedById,
      'USER_DEACTIVATED',
      'User',
      user.id,
      request,
      {
        isActive: false,
        reason,
      },
      {
        isActive: true,
      },
    );

    return user;
  }

  async activateUser(id: number, activatedById: number, request?: NextRequest) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    await this.activityLogService.logUserAction(
      activatedById,
      'USER_ACTIVATED',
      'User',
      user.id,
      request,
      { isActive: true },
      { isActive: false },
    );

    return user;
  }
}
