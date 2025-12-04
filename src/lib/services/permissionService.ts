// work4fun/src/lib/services/permissionService.ts
import { prisma } from '@/lib/prisma';

// Вспомогательная функция для безопасного парсинга visibleGroups
const safeParseVisibleGroups = (visibleGroups: any): string[] => {
  if (!visibleGroups) return [];

  try {
    // Если это уже массив
    if (Array.isArray(visibleGroups)) {
      return visibleGroups.map((item: any) => String(item));
    }

    // Если это JSON строка
    if (typeof visibleGroups === 'string') {
      const parsed = JSON.parse(visibleGroups);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => String(item));
      }
    }

    return [];
  } catch (error) {
    console.error('Error parsing visibleGroups:', error);
    return [];
  }
};

export class PermissionService {
  /**
   * Проверяет, может ли пользователь создать новый проект
   */
  static async canCreateProject(userId: string | number): Promise<boolean> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { role: true },
    });

    if (!user) return false;

    if (user.role === 'SUPER_ADMIN') return true;

    const ownedProjectsCount = await prisma.project.count({
      where: { ownerId: userIdNum },
    });

    return ownedProjectsCount < 3;
  }

  /**
   * Получает количество проектов, созданных пользователем
   */
  static async getOwnedProjectsCount(userId: string | number): Promise<number> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    return await prisma.project.count({
      where: { ownerId: userIdNum },
    });
  }

  /**
   * Увеличивает счетчик проектов пользователя
   */
  static async incrementProjectCount(userId: string | number): Promise<void> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    await prisma.user.update({
      where: { id: userIdNum },
      data: {
        projectCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Проверяет доступ к проекту
   */
  static async canViewProject(
    userId: string | number,
    projectId: string | number
  ): Promise<boolean> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId) : projectId;

    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userIdNum,
        projectId: projectIdNum,
        isActive: true,
      },
    });

    return !!userProject;
  }

  /**
   * Проверяет возможность редактирования проекта
   */
  static async canEditProject(
    userId: string | number,
    projectId: string | number
  ): Promise<boolean> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId) : projectId;

    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userIdNum,
        projectId: projectIdNum,
        isActive: true,
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
      },
    });

    return !!userProject;
  }

  /**
   * Проверяет доступ к задачам группы
   */
  static async canViewGroupTasks(
    userId: string | number,
    groupId: string | number
  ): Promise<boolean> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const groupIdNum = typeof groupId === 'string' ? parseInt(groupId) : groupId;

    const group = await prisma.group.findUnique({
      where: { id: groupIdNum },
      include: { project: true },
    });

    if (!group) return false;

    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userIdNum,
        projectId: group.projectId,
        isActive: true,
      },
    });

    if (!userProject) return false;

    if (userProject.scope === 'ALL') return true;

    if (userProject.scope === 'SPECIFIC_GROUPS') {
      const visibleGroups = safeParseVisibleGroups(userProject.visibleGroups);
      return visibleGroups.includes(groupIdNum.toString());
    }

    return false;
  }

  /**
   * Получает видимые группы пользователя
   */
  static async getVisibleGroupIds(
    userId: string | number,
    projectId: string | number
  ): Promise<number[]> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId) : projectId;

    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userIdNum,
        projectId: projectIdNum,
        isActive: true,
      },
    });

    if (!userProject) return [];

    if (userProject.scope === 'ALL') {
      const groups = await prisma.group.findMany({
        where: { projectId: projectIdNum },
        select: { id: true },
      });
      return groups.map((g) => g.id);
    }

    if (userProject.scope === 'SPECIFIC_GROUPS') {
      const visibleGroups = safeParseVisibleGroups(userProject.visibleGroups);
      return visibleGroups.map((id) => parseInt(id)).filter((id) => !isNaN(id));
    }

    return [];
  }

  /**
   * Получает информацию о доступе пользователя к проекту
   */
  static async getUserProjectAccess(userId: string | number, projectId: string | number) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId) : projectId;

    return await prisma.userProject.findFirst({
      where: {
        userId: userIdNum,
        projectId: projectIdNum,
      },
    });
  }
}
