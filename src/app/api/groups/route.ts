// src/app/api/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/groups - Получить список групп
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const projectId = searchParams.get('projectId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Базовый запрос с фильтрами
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) {
      where.projectId = parseInt(projectId);
    }

    // Получаем группы с подсчетом пользователей и проектов
    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          users: {
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
          },
          _count: {
            select: {
              users: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.group.count({ where }),
    ]);

    // Форматируем ответ
    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      projectId: group.projectId,
      project: group.project,
      users: group.users.map((ug) => ug.user),
      userCount: group._count.users,
      taskCount: group._count.tasks,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));

    return NextResponse.json({
      groups: formattedGroups,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Ошибка при получении групп' }, { status: 500 });
  }
}

// POST /api/groups - Создать новую группу
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Только админы и супер-админы могут создавать группы
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, projectId } = body;

    // Валидация
    if (!name || !projectId) {
      return NextResponse.json({ error: 'Название группы и проект обязательны' }, { status: 400 });
    }

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Создаем группу
    const group = await prisma.group.create({
      data: {
        name,
        description: description || '',
        projectId: parseInt(projectId),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Логируем действие с правильным типом userId
    await audit.create(
      parseInt(session.user.id),
      'Group',
      group.id,
      { name, description, projectId },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Ошибка при создании группы' }, { status: 500 });
  }
}
