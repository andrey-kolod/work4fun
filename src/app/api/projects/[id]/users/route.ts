// src/app/api/projects/[id]/users/route.ts
// ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ
// Изменения:
// - Импорт audit — default export (import audit from '@/lib/audit').
// - Все ID — string (cuid()).
// - prisma.projectMembership — правильная модель.
// - Проверка прав через PermissionService (безопасность по PRD).
// - Проверка дубликатов.
// - Dev-логи для отладки.
// - Для чего этот файл: Управление участниками конкретного проекта (добавление/просмотр).
//   Используется в админке или в настройках проекта (PROJECT_OWNER/ADMIN может добавлять).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import audit from '@/lib/audit'; // ИСПРАВЛЕНО: default import (без {})
import { PermissionService } from '@/lib/services/permissionService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // projectId — string
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body; // userId — string

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверка прав
    const canEdit = await PermissionService.canEditProject(session.user.id, project.id);
    if (!canEdit) {
      return NextResponse.json({ error: 'Нет прав на добавление участников' }, { status: 403 });
    }

    // Проверка дубликатов
    const existing = await prisma.projectMembership.findFirst({
      where: { userId, projectId: project.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'Пользователь уже в проекте' }, { status: 400 });
    }

    // Добавляем как PROJECT_MEMBER
    const membership = await prisma.projectMembership.create({
      data: {
        userId,
        projectId: project.id,
        role: 'PROJECT_MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Логируем действие
    await audit.create(
      session.user.id,
      'Project',
      project.id,
      {
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'USER_ADDED_TO_PROJECT',
      },
      request
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /projects/[id]/users POST] Пользователь ${userId} добавлен в проект ${project.id}`
      );
    }

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('💥 [API /projects/[id]/users POST] Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка при добавлении пользователя' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const canView = await PermissionService.canViewProject(session.user.id, id);
    if (!canView) {
      return NextResponse.json({ error: 'Нет доступа к проекту' }, { status: 403 });
    }

    const memberships = await prisma.projectMembership.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const users = memberships.map((m) => ({
      user: {
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        role: m.user.role,
        membershipRole: m.role,
      },
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API /projects/[id]/users GET] ${users.length} участников проекта ${id}`);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('💥 [API /projects/[id]/users GET] Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка при получении участников' }, { status: 500 });
  }
}
