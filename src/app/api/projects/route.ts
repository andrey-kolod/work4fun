// src/app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/projects - Получить список проектов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Для обычных пользователей показываем только их проекты
    if (session.user.role === 'USER') {
      const userProjects = await prisma.userProject.findMany({
        where: { userId: parseInt(session.user.id) },
        select: { projectId: true },
      });
      where.id = { in: userProjects.map((up) => up.projectId) };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          groups: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  users: true,
                  tasks: true,
                },
              },
            },
          },
          userProjects: {
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
          },
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              userProjects: true,
              groups: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    const formattedProjects = projects.map((project) => {
      const totalTasks = project._count.tasks;
      const completedTasks = project.tasks.filter((task) => task.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        owner: project.owner,
        progress,
        groups: project.groups.map((group) => ({
          id: group.id,
          name: group.name,
          userCount: group._count.users,
          taskCount: group._count.tasks,
        })),
        users: project.userProjects.map((up) => up.user),
        stats: {
          totalTasks: project._count.tasks,
          totalUsers: project._count.userProjects,
          totalGroups: project._count.groups,
          completedTasks,
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });

    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Ошибка при получении проектов' }, { status: 500 });
  }
}

// POST /api/projects - Создать новый проект
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Название проекта обязательно' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        ownerId: parseInt(session.user.id),
        status: 'ACTIVE',
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

    await prisma.userProject.create({
      data: {
        userId: parseInt(session.user.id),
        projectId: project.id,
      },
    });

    await audit.create(
      parseInt(session.user.id),
      'Project',
      project.id,
      { name, description, status: 'ACTIVE' },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Ошибка при создании проекта' }, { status: 500 });
  }
}
