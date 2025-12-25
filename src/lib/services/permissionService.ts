// src/lib/services/permissionService.ts
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export class PermissionService {
  /**
   * Проверяет, может ли пользователь создать новый проект.
   * Считает проекты, где пользователь имеет роль PROJECT_OWNER в ProjectMembership.
   */
  static async canCreateProject(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // SUPER_ADMIN может создавать без ограничений
    if (user.role === $Enums.Role.SUPER_ADMIN) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ [PermissionService] SUPER_ADMIN ${userId} может создавать проекты без ограничений`
        );
      }
      return true;
    }

    // Считаем проекты, где пользователь имеет роль PROJECT_OWNER в memberships
    const ownedProjectsCount = await prisma.projectMembership.count({
      where: {
        userId,
        role: $Enums.ProjectRole.PROJECT_OWNER,
      },
    });

    const MAX_PROJECTS_FOR_OWNER = 3;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 [PermissionService] USER ${userId}: ${ownedProjectsCount}/${MAX_PROJECTS_FOR_OWNER} проектов (как PROJECT_OWNER)`
      );
    }

    return ownedProjectsCount < MAX_PROJECTS_FOR_OWNER;
  }

  /**
   * Возвращает количество проектов, где пользователь PROJECT_OWNER
   */
  static async getOwnedProjectsCount(userId: string): Promise<number> {
    const count = await prisma.projectMembership.count({
      where: {
        userId,
        role: $Enums.ProjectRole.PROJECT_OWNER,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 [PermissionService] ${userId} владеет ${count} проектами (как PROJECT_OWNER)`
      );
    }

    return count;
  }

  /**
   * Получает детальную информацию о лимите проектов
   * [ИСПРАВЛЕНИЕ] Добавлен этот метод, которого не хватало
   */
  static async getProjectCreationInfo(userId: string): Promise<{
    canCreate: boolean;
    ownedCount: number;
    maxAllowed: number;
    reason?: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return {
        canCreate: false,
        ownedCount: 0,
        maxAllowed: 0,
        reason: 'Пользователь не найден',
      };
    }

    // SUPER_ADMIN не имеет ограничений
    if (user.role === $Enums.Role.SUPER_ADMIN) {
      return {
        canCreate: true,
        ownedCount: 0,
        maxAllowed: Infinity,
      };
    }

    // Для обычных пользователей считаем PROJECT_OWNER проекты
    const ownedCount = await this.getOwnedProjectsCount(userId);
    const MAX_PROJECTS = 3;

    const canCreate = ownedCount < MAX_PROJECTS;
    let reason: string | undefined;

    if (!canCreate) {
      reason = `Достигнут лимит в ${MAX_PROJECTS} проекта. У вас уже ${ownedCount} проектов в качестве владельца.`;
    }

    return {
      canCreate,
      ownedCount,
      maxAllowed: MAX_PROJECTS,
      reason,
    };
  }

  static async canViewProject(userId: string, projectId: string): Promise<boolean> {
    const membership = await prisma.projectMembership.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    return !!membership;
  }

  static async canEditProject(userId: string, projectId: string): Promise<boolean> {
    const globalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (globalUser?.role === $Enums.Role.SUPER_ADMIN) return true;

    const membership = await prisma.projectMembership.findFirst({
      where: {
        userId,
        projectId,
        role: {
          in: [$Enums.ProjectRole.PROJECT_OWNER, $Enums.ProjectRole.PROJECT_ADMIN],
        },
      },
    });

    return !!membership;
  }

  static async canViewGroupTasks(userId: string, groupId: string): Promise<boolean> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { projectId: true },
    });

    if (!group) return false;

    return this.canViewProject(userId, group.projectId);
  }

  static async getVisibleGroupIds(userId: string, projectId: string): Promise<string[]> {
    const hasAccess = await this.canViewProject(userId, projectId);
    if (!hasAccess) return [];

    const groups = await prisma.group.findMany({
      where: { projectId },
      select: { id: true },
    });

    return groups.map((g) => g.id);
  }

  static async getUserProjectAccess(userId: string, projectId: string) {
    return prisma.projectMembership.findFirst({
      where: { userId, projectId },
    });
  }

  static async getUserRoleInProject(
    userId: string,
    projectId: string
  ): Promise<$Enums.ProjectRole | null> {
    const membership = await prisma.projectMembership.findFirst({
      where: { userId, projectId },
      select: { role: true },
    });

    return membership?.role ?? null;
  }
}
