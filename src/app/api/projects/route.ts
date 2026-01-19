// src/app/api/projects/route.ts
// ✅ ПУТЬ: /src/app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PermissionService } from '@/lib/services/permissionService';
import { withApiMetrics, withPrismaMetrics } from '@/lib/api/withMetrics';
import { logger } from '@/lib/logger';
import { userRegistrationsCounter } from '@/lib/metrics'; // если нужно

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

async function makeSlugUnique(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    // ✅ МЕТРИКА PRISMA: findFirst
    const exists = await withPrismaMetrics('findFirst', 'Project', () =>
      prisma.project.findFirst({ where: { slug } })
    );
    if (!exists) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

// ✅ GET с метриками
export const GET = withApiMetrics(async (request: NextRequest) => {
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
  }

  // ✅ МЕТРИКИ PRISMA: параллельно findMany + count
  const [projects, total] = await Promise.all([
    withPrismaMetrics('findMany', 'Project', () =>
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
      })
    ),
    withPrismaMetrics('count', 'Project', () => prisma.project.count({ where })),
  ]);

  // -- SQL для findMany (автоматически логируется в withPrismaMetrics):
  // SELECT "t0".*, "owner".*, COUNT("Task"), COUNT("ProjectMembership") FROM "Project" ...

  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    projects,
    pagination: { page, pageSize, total, totalPages },
  });
}, '/api/projects'); // ← путь для метрик

// ✅ POST с метриками
export const POST = withApiMetrics(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id as string;

  // ✅ ПРОВЕРКА ЛИМИТА через сервис
  const canCreate = await PermissionService.canCreateProject(userId);

  if (!canCreate) {
    const ownedCount = await PermissionService.getOwnedProjectsCount(userId);
    const MAX_PROJECTS = 3;
    return NextResponse.json(
      {
        error: 'Превышен лимит проектов',
        details: `Вы уже владеете ${ownedCount} из ${MAX_PROJECTS} проектов.`,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return NextResponse.json(
      { error: 'Название проекта обязательно (минимум 3 символа)' },
      { status: 400 }
    );
  }

  let slug = generateSlug(name.trim());
  slug = await makeSlugUnique(slug);

  // ✅ ТРАНЗАКЦИЯ с метриками Prisma
  const result = await withPrismaMetrics('transaction', 'Project', async () => {
    return await prisma.$transaction(async (tx) => {
      // 1. CREATE Project
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

      // 2. CREATE ProjectMembership
      await tx.projectMembership.create({
        data: {
          userId,
          projectId: project.id,
          role: 'PROJECT_OWNER',
        },
      });

      // 3. CREATE AuditLog
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
  });

  // ✅ БИЗНЕС-МЕТРИКА (опционально)
  // userRegistrationsCounter.inc(); // если это регистрация

  logger.info(
    {
      projectId: result.id,
      slug: result.slug,
      ownerId: userId,
    },
    '✅ Project created successfully'
  );

  return NextResponse.json({ project: result, message: 'Проект успешно создан' }, { status: 201 });
}, '/api/projects');
