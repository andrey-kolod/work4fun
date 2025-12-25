// src/app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PermissionService } from '@/lib/services/permissionService';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // пробелы → дефис
    .replace(/[^a-z0-9-]/g, '') // убираем всё кроме букв, цифр, дефиса
    .replace(/-+/g, '-'); // несколько дефисов → один
}

async function makeSlugUnique(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const exists = await prisma.project.findFirst({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

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
        select: {
          id: true,
          name: true,
          description: true,
          slug: true, // slug теперь возвращается
          status: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { tasks: true, members: true },
          },
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
      console.log(
        '🔗 [API /projects GET] Slug в ответе:',
        projects.map((p) => p.slug)
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

    const userId = session.user.id as string;

    // [ИСПРАВЛЕНО] Используем обновлённый метод с правильной логикой подсчёта
    const canCreate = await PermissionService.canCreateProject(userId);

    if (!canCreate) {
      // [ИСПРАВЛЕНО] Получаем корректное количество проектов
      const ownedCount = await PermissionService.getOwnedProjectsCount(userId);
      const MAX_PROJECTS = 3;

      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `🚫 [API /projects POST] Отказ пользователю ${userId}: ${ownedCount}/${MAX_PROJECTS} проектов`
        );
      }

      return NextResponse.json(
        {
          error: 'Превышен лимит проектов',
          details: `Вы уже являетесь владельцем ${ownedCount} из ${MAX_PROJECTS} возможных проектов. Для создания нового передайте владение одним из существующих проектов.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Название проекта обязательно, минимум 3 символа' },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    slug = await makeSlugUnique(slug);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [API /projects POST] Создание проекта "${name}" для пользователя ${userId}`);
      console.log(`🔗 [API /projects POST] Сгенерированный slug: ${slug}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Создаём проект
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          slug,
          status: 'ACTIVE',
          ownerId: userId, // ownerId в модели Project для быстрого поиска
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // [ВАЖНО] Создаём запись в ProjectMembership с ролью PROJECT_OWNER
      await tx.projectMembership.create({
        data: {
          userId,
          projectId: project.id,
          role: 'PROJECT_OWNER', // Это то, что считает лимит!
        },
      });

      // Аудит-лог
      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'Project',
          entityId: project.id,
          action: 'CREATE',
          details: JSON.stringify({
            name: project.name,
            slug,
            ownerId: userId,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
        },
      });

      return project;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API /projects POST] Проект создан (ID: ${result.id}, slug: ${result.slug})`);
      console.log(
        `👑 [API /projects POST] Пользователь ${userId} назначен PROJECT_OWNER проекта ${result.id}`
      );
    }

    return NextResponse.json(
      { project: result, message: 'Проект успешно создан' },
      { status: 201 }
    );
  } catch (error) {
    console.error('💥 [API /projects POST] Ошибка:', error);
    return NextResponse.json({ error: 'Ошибка при создании проекта' }, { status: 500 });
  }
}
