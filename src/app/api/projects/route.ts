// src/app/api/projects/route.ts
// ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ ФАЙЛ
// Изменения:
// - Все ID — string (cuid()).
// - Отношение — members.
// - _count.members — количество участников.
// - Убрано incrementProjectCount (поля нет).
// - Пагинация + поиск.
// - Безопасность: проверка прав через PermissionService.
// - Dev-логи.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PermissionService } from '@/lib/services/permissionService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const search = searchParams.get('search')?.trim() || null;

    const skip = (page - 1) * pageSize;

    const baseCondition = { status: 'ACTIVE' };

    const searchCondition = search ? { name: { contains: search, mode: 'insensitive' } } : {};

    let where: any = { ...baseCondition, ...searchCondition };

    if (session.user.role !== 'SUPER_ADMIN') {
      const userId = session.user.id as string;

      where = {
        AND: [
          { ...baseCondition, ...searchCondition },
          {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          },
        ],
      };

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [API /projects GET] Пользователь ${userId}: свои проекты`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [API /projects GET] SUPER_ADMIN: все проекты');
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { tasks: true, members: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /projects GET] ${projects.length} проектов (страница ${page}/${totalPages})`
      );
    }

    return NextResponse.json({
      projects,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error('💥 [API /projects GET] Ошибка:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, ownerId: rawOwnerId, startDate, endDate } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Название проекта обязательно' }, { status: 400 });
    }

    const ownerId = (rawOwnerId as string) || (session.user.id as string);

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return NextResponse.json({ error: 'Пользователь-владелец не найден' }, { status: 404 });
    }

    const canCreate = await PermissionService.canCreateProject(ownerId);
    if (!canCreate) {
      const ownedCount = await PermissionService.getOwnedProjectsCount(ownerId);
      return NextResponse.json(
        { error: `Превышен лимит (макс. 3). Уже ${ownedCount}` },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId,
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.projectMembership.create({
      data: {
        userId: ownerId,
        projectId: project.id,
        role: 'PROJECT_OWNER',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /projects POST] Проект создан (ID: ${project.id}), владелец: ${ownerId}`
      );
    }

    return NextResponse.json({ project, message: 'Проект успешно создан' }, { status: 201 });
  } catch (error) {
    console.error('💥 [API /projects POST] Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка при создании проекта' }, { status: 500 });
  }
}
