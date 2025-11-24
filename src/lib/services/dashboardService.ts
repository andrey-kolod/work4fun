// src/app/lib/services/dashboardService.ts

import { prisma } from '@/lib/db';

export interface DashboardStats {
  project: any;
  taskStats: Array<{
    status: string;
    count: number;
  }>;
  recentTasks: any[];
  userCount: number;
  groupCount: number;
}

export class DashboardService {
  async getDashboardData(
    projectId: number,
    userId: number,
    userRole: string,
  ): Promise<DashboardStats> {
    const hasAccess = await this.checkProjectAccess(projectId, userId, userRole);

    if (!hasAccess) {
      throw new Error('Access denied to project');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            userProjects: true,
            groups: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // 🎯 ОСНОВНОЕ ИСПРАВЛЕНИЕ: Добавляем фильтрацию по пользователю
    let tasksWhereClause: any = { projectId };

    // Если пользователь не SUPER_ADMIN, фильтруем задачи
    if (userRole !== 'SUPER_ADMIN') {
      tasksWhereClause = {
        ...tasksWhereClause,
        OR: [
          { creatorId: userId }, // Задачи созданные пользователем
          {
            assignments: {
              some: {
                userId: userId, // Задачи назначенные пользователю
              },
            },
          },
        ],
      };
    }

    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: tasksWhereClause, // 🎯 Используем фильтрованный where
      _count: {
        id: true,
      },
    });

    const recentTasks = await prisma.task.findMany({
      where: tasksWhereClause, // 🎯 Используем фильтрованный where
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        group: {
          select: { name: true },
        },
        assignments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const userCount = await prisma.userProject.count({
      where: { projectId },
    });
    const groupCount = await prisma.group.count({
      where: { projectId },
    });

    return {
      project,
      taskStats: taskStats.map((stat) => ({
        status: stat.status,
        count: stat._count.id,
      })),
      recentTasks,
      userCount,
      groupCount,
    };
  }

  private async checkProjectAccess(
    projectId: number,
    userId: number,
    userRole: string,
  ): Promise<boolean> {
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userId,
        projectId: projectId,
      },
    });

    return !!userProject;
  }

  async getUserProjects(userId: number, userRole: string) {
    if (userRole === 'SUPER_ADMIN') {
      return await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
          owner: {
            select: { firstName: true, lastName: true, email: true },
          },
          _count: {
            select: {
              tasks: true,
              userProjects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return await prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        userProjects: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        owner: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            tasks: true,
            userProjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
