// src/lib/services/permissionService.ts

import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export class PermissionService {
  static async canCreateProject(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // SQL: SELECT role FROM "User" WHERE id = $1

    if (!user) return false;

    if (user.role === $Enums.Role.SUPER_ADMIN) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ [PermissionService] SUPER_ADMIN ${userId} может создавать проекты без ограничений`
        );
      }
      return true;
    }

    const ownedProjectsCount = await prisma.projectMembership.count({
      where: {
        userId,
        role: $Enums.ProjectRole.PROJECT_OWNER,
      },
    });
    // SQL: SELECT COUNT(*) FROM "ProjectMembership"
    // WHERE userId = $1 AND role = 'PROJECT_OWNER'

    const MAX_PROJECTS_FOR_OWNER = 3;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 [PermissionService] USER ${userId}: ${ownedProjectsCount}/${MAX_PROJECTS_FOR_OWNER} проектов (как PROJECT_OWNER)`
      );
    }

    return ownedProjectsCount < MAX_PROJECTS_FOR_OWNER;
  }

  static async getOwnedProjectsCount(userId: string): Promise<number> {
    const count = await prisma.projectMembership.count({
      where: {
        userId,
        role: $Enums.ProjectRole.PROJECT_OWNER,
      },
    });
    // SQL: SELECT COUNT(*) FROM "ProjectMembership"
    // WHERE userId = $1 AND role = 'PROJECT_OWNER'

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 [PermissionService] ${userId} владеет ${count} проектами (как PROJECT_OWNER)`
      );
    }

    return count;
  }

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
    // SQL: SELECT role FROM "User" WHERE id = $1

    if (!user) {
      return {
        canCreate: false,
        ownedCount: 0,
        maxAllowed: 0,
        reason: 'Пользователь не найден',
      };
    }

    if (user.role === $Enums.Role.SUPER_ADMIN) {
      return {
        canCreate: true,
        ownedCount: 0,
        maxAllowed: Infinity,
      };
    }

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
  // SQL: SELECT * FROM "ProjectMembership"
  // WHERE userId = $1 AND projectId = $2
  // LIMIT 1

  static async canEditProject(userId: string, projectId: string): Promise<boolean> {
    const globalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // SQL: SELECT role FROM "User" WHERE id = $1

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
    // SQL: SELECT * FROM "ProjectMembership"
    // WHERE userId = $1 AND projectId = $2
    // AND role IN ('PROJECT_OWNER', 'PROJECT_ADMIN')
    // LIMIT 1

    return !!membership;
  }

  static async canViewGroupTasks(userId: string, groupId: string): Promise<boolean> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { projectId: true },
    });
    // SQL: SELECT projectId FROM "Group" WHERE id = $1

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
    // SQL: SELECT id FROM "Group" WHERE projectId = $1

    return groups.map((g) => g.id);
  }

  static async getUserProjectAccess(userId: string, projectId: string) {
    return prisma.projectMembership.findFirst({
      where: { userId, projectId },
    });
    // SQL: SELECT * FROM "ProjectMembership"
    // WHERE userId = $1 AND projectId = $2
    // LIMIT 1
  }

  static async getUserRoleInProject(
    userId: string,
    projectId: string
  ): Promise<$Enums.ProjectRole | null> {
    const membership = await prisma.projectMembership.findFirst({
      where: { userId, projectId },
      select: { role: true },
    });
    // SQL: SELECT role FROM "ProjectMembership"
    // WHERE userId = $1 AND projectId = $2
    // LIMIT 1

    return membership?.role ?? null;
  }
}
