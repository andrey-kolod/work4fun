// work4fun/src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PermissionService } from '@/lib/services/permissionService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let projects;

    if (session.user.role === 'SUPER_ADMIN') {
      // Супер-админ видит все проекты
      projects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
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
    } else {
      // Обычный пользователь видит только свои проекты
      projects = await prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { ownerId: parseInt(session.user.id) },
            {
              userProjects: {
                some: {
                  userId: userId ? parseInt(userId) : parseInt(session.user.id),
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
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

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы и супер-админы могут создавать проекты
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    // Валидация
    if (!name) {
      return NextResponse.json({ error: 'Название проекта обязательно' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Проверяем, может ли пользователь создать проект
    const canCreate = await PermissionService.canCreateProject(userId);
    if (!canCreate) {
      // Получаем количество проектов пользователя для информативного сообщения
      const ownedProjectsCount = await PermissionService.getOwnedProjectsCount(userId);
      return NextResponse.json(
        {
          error: `Превышен лимит проектов. Вы можете создать максимум 3 проекта. У вас уже создано: ${ownedProjectsCount}`,
        },
        { status: 400 }
      );
    }

    // Создаем проект с текущим пользователем как владельцем
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: userId,
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Добавляем создателя как ADMIN с полным доступом
    await prisma.userProject.create({
      data: {
        userId: userId,
        projectId: project.id,
        role: session.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
        scope: 'ALL',
        isActive: true,
      },
    });

    // Увеличиваем счетчик проектов
    await PermissionService.incrementProjectCount(userId);

    return NextResponse.json(
      {
        project,
        message: 'Проект успешно создан',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Ошибка при создании проекта',
      },
      { status: 500 }
    );
  }
}
