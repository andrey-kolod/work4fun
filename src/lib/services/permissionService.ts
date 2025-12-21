// src/lib/services/permissionService.ts

import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export class PermissionService {
  static async canCreateProject(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    if (user.role === $Enums.Role.SUPER_ADMIN) return true;

    const ownedCount = await prisma.project.count({
      where: { ownerId: userId },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔍 [PermissionService.canCreateProject] ${userId}: ${ownedCount}/3 проектов (владелец)`
      );
    }

    return ownedCount < 3;
  }

  static async getOwnedProjectsCount(userId: string): Promise<number> {
    const count = await prisma.project.count({
      where: { ownerId: userId },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [PermissionService.getOwnedProjectsCount] ${userId}: ${count} проектов`);
    }

    return count;
  }

  static async canViewProject(userId: string, projectId: string): Promise<boolean> {
    const membership = await prisma.projectMembership.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔍 [PermissionService.canViewProject] ${userId} -> проект ${projectId}: ${!!membership}`
      );
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔍 [PermissionService.canEditProject] ${userId} -> проект ${projectId}: ${!!membership}`
      );
    }

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
