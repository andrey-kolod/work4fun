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
    // SELECT * FROM "Project" WHERE slug = $1 LIMIT 1
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
        console.log(
          `🔍 [API /projects GET] Обычный пользователь ${userId}: фильтр по своим проектам`
        );
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [API /projects GET] SUPER_ADMIN: доступ ко всем проектам');
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
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

    // -- [ПРИМЕРНЫЙ SQL для findMany]
    // SELECT
    //   "t0"."id", "t0"."name", "t0"."description", "t0"."slug", "t0"."status",
    //   "t0"."createdAt", "t0"."updatedAt",
    //   "owner"."id" AS "owner_id", "owner"."firstName" AS "owner_firstName",
    //   "owner"."lastName" AS "owner_lastName", "owner"."email" AS "owner_email",
    //   (
    //     SELECT COUNT(*) FROM "Task" WHERE "Task"."projectId" = "t0"."id"
    //   ) AS "_count_tasks",
    //   (
    //     SELECT COUNT(*) FROM "ProjectMembership" WHERE "ProjectMembership"."projectId" = "t0"."id"
    //   ) AS "_count_members"
    // FROM "Project" AS "t0"
    // LEFT JOIN "User" AS "owner" ON "t0"."ownerId" = "owner"."id"
    // WHERE ... -- условия из where
    // ORDER BY "t0"."name" ASC
    // LIMIT $1 OFFSET $2

    const totalPages = Math.ceil(total / pageSize);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /projects GET] Возвращено ${projects.length} проектов (страница ${page}/${totalPages}, всего ${total})`
      );
      console.log(
        '🔗 [API /projects GET] Примеры slug:',
        projects.slice(0, 3).map((p) => p.slug)
      );
    }

    return NextResponse.json({
      projects,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 [API /projects GET] Неожиданная ошибка:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // [ПРОВЕРКА ЛИМИТА] Используем сервис прав
    const canCreate = await PermissionService.canCreateProject(userId);

    if (!canCreate) {
      const ownedCount = await PermissionService.getOwnedProjectsCount(userId);
      const MAX_PROJECTS = 3;

      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `🚫 [API /projects POST] Отказ в создании: пользователь ${userId} уже имеет ${ownedCount}/${MAX_PROJECTS} проектов`
        );
      }

      return NextResponse.json(
        {
          error: 'Превышен лимит проектов',
          details: `Вы уже являетесь владельцем ${ownedCount} из ${MAX_PROJECTS} возможных проектов.`,
        },
        { status: 403 }
      );
    }

    // Парсим тело запроса
    const body = await request.json();
    const { name, description } = body;

    // Валидация названия
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Название проекта обязательно и должно содержать минимум 3 символа' },
        { status: 400 }
      );
    }

    // Генерация и уникализация slug
    let slug = generateSlug(name.trim());
    slug = await makeSlugUnique(slug);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📝 [API /projects POST] Создание проекта "${name.trim()}" для пользователя ${userId}`
      );
      console.log(`🔗 [API /projects POST] Сгенерированный уникальный slug: ${slug}`);
    }

    // Атомарная транзакция: проект + membership + audit log
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создаём проект
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          slug,
          status: 'ACTIVE',
          ownerId: userId,
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // 2. Назначаем владельца через ProjectMembership (это важно для лимита!)
      await tx.projectMembership.create({
        data: {
          userId,
          projectId: project.id,
          role: 'PROJECT_OWNER',
        },
      });

      // 3. Записываем аудит-лог
      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'Project',
          entityId: project.id,
          action: 'CREATE',
          details: JSON.stringify({
            name: project.name,
            slug: project.slug,
            ownerId: userId,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
        },
      });

      return project;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [API /projects POST] Проект успешно создан: ID=${result.id}, slug=${result.slug}`
      );
      console.log(`👑 [API /projects POST] Пользователь ${userId} назначен PROJECT_OWNER`);
    }

    return NextResponse.json(
      { project: result, message: 'Проект успешно создан' },
      { status: 201 }
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 [API /projects POST] Неожиданная ошибка:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка при создании проекта', details: error.message },
      { status: 500 }
    );
  }
}
