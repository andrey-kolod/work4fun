// src/app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/projects/[id] - Получить проект по ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
          include: {
            users: {
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
              include: {
                assignments: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
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
        },
        userProjects: {
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
        tasks: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем доступ для обычных пользователей
    if (session.user.role === 'USER') {
      const userInProject = await prisma.userProject.findFirst({
        where: {
          userId: parseInt(session.user.id),
          projectId: project.id,
        },
      });

      if (!userInProject) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
    }

    // Вычисляем прогресс
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((task) => task.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Форматируем ответ
    const formattedProject = {
      ...project,
      progress,
      stats: {
        totalTasks: project._count.tasks,
        totalUsers: project._count.userProjects,
        totalGroups: project._count.groups,
        completedTasks,
      },
      users: project.userProjects.map((up) => up.user),
    };

    return NextResponse.json({ project: formattedProject });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Ошибка при получении проекта' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Обновить проект
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { name, description, status, startDate, endDate, ownerId } = body;

    // Получаем текущий проект для логирования
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!currentProject) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем права - только владелец, админы или супер-админы могут редактировать
    if (session.user.role === 'USER' && currentProject.ownerId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: ownerId ? parseInt(ownerId) : currentProject.ownerId,
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

    // Логируем изменения
    await audit.update(
      parseInt(session.user.id),
      'Project',
      updatedProject.id,
      {
        name: currentProject.name,
        description: currentProject.description,
        status: currentProject.status,
        ownerId: currentProject.ownerId,
      },
      {
        name,
        description,
        status,
        ownerId: ownerId ? parseInt(ownerId) : currentProject.ownerId,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении проекта' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Удалить проект (только SUPER_ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Только SUPER_ADMIN может удалять проекты
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        groups: {
          include: {
            users: true,
            tasks: true,
          },
        },
        userProjects: true,
        tasks: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем, есть ли связанные данные
    if (project.groups.length > 0) {
      return NextResponse.json({ error: 'Невозможно удалить проект с группами' }, { status: 400 });
    }

    if (project.tasks.length > 0) {
      return NextResponse.json({ error: 'Невозможно удалить проект с задачами' }, { status: 400 });
    }

    // Удаляем связи пользователей с проектом
    await prisma.userProject.deleteMany({
      where: { projectId },
    });

    // Удаляем проект
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Логируем действие
    await audit.delete(
      parseInt(session.user.id),
      'Project',
      project.id,
      {
        name: project.name,
        description: project.description,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ message: 'Проект удален' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Ошибка при удалении проекта' }, { status: 500 });
  }
}
