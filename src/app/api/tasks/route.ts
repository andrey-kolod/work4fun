// src/app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/tasks - Получить все задачи
export async function GET(request: NextRequest) {
  try {
    console.log('[API TASKS] Получение задач');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('[API TASKS] Не авторизован');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const groupId = searchParams.get('groupId');

    console.log('[API TASKS] Параметры:', { projectId, groupId, userId: session.user.id });

    // Базовые условия запроса
    const where: any = {};

    if (projectId) {
      const projectIdNum = parseInt(projectId);
      if (isNaN(projectIdNum)) {
        return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
      }
      where.projectId = projectIdNum;
    }

    if (groupId) {
      const groupIdNum = parseInt(groupId);
      if (isNaN(groupIdNum)) {
        return NextResponse.json({ error: 'Invalid groupId' }, { status: 400 });
      }
      where.groupId = groupIdNum;
    }

    // Проверяем права доступа
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    if (userRole !== 'SUPER_ADMIN') {
      // Получаем проекты пользователя
      const userProjects = await prisma.userProject.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const accessibleProjectIds = userProjects.map((up) => up.projectId);

      if (projectId && !accessibleProjectIds.includes(parseInt(projectId))) {
        console.log('[API TASKS] Нет доступа к проекту');
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      if (!projectId) {
        where.projectId = { in: accessibleProjectIds };
      }
    }

    console.log('[API TASKS] WHERE условия:', where);

    // Получаем задачи с сортировкой (новые сверху)
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
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
      },
      orderBy: [{ createdAt: 'desc' }, { status: 'asc' }, { dueDate: 'asc' }], // Новые задачи сверху
    });

    console.log(`[API TASKS] Найдено задач: ${tasks.length}`);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[API TASKS] Ошибка:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Создать новую задачу
export async function POST(request: NextRequest) {
  try {
    console.log('[API TASKS POST] Создание задачи');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('[API TASKS POST] Не авторизован');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const data = await request.json();

    console.log('[API TASKS POST] Данные:', data);

    // Валидация
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 });
    }

    if (!data.projectId) {
      return NextResponse.json({ error: 'Проект обязателен' }, { status: 400 });
    }

    const projectId = parseInt(data.projectId);

    // Проверяем доступ к проекту
    if (session.user.role !== 'SUPER_ADMIN') {
      const userProject = await prisma.userProject.findFirst({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (!userProject) {
        console.log('[API TASKS POST] Нет доступа к проекту');
        return NextResponse.json({ error: 'Нет доступа к проекту' }, { status: 403 });
      }
    }

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Создаем задачу
    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: projectId,
        groupId: data.groupId ? parseInt(data.groupId) : null,
        creatorId: userId,
        estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : null,
        actualHours: 0,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[API TASKS POST] Задача создана:', task.id);

    // Если есть назначенные пользователи (поддержка обоих полей: assignedTo и assigneeIds)
    const assigneeIds = data.assigneeIds || data.assignedTo || [];

    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      console.log('[API TASKS POST] Назначение пользователей:', assigneeIds);

      // Проверяем, что все пользователи существуют и имеют доступ к проекту
      const validUsers = await prisma.userProject.findMany({
        where: {
          userId: { in: assigneeIds },
          projectId: projectId,
        },
        select: { userId: true },
      });

      const validUserIds = validUsers.map((up) => up.userId);

      // Создаем назначения только для валидных пользователей
      if (validUserIds.length > 0) {
        const assignments = await Promise.all(
          validUserIds.map((assigneeId: number) =>
            prisma.taskAssignment.create({
              data: {
                taskId: task.id,
                userId: assigneeId,
                assignedBy: userId,
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
            })
          )
        );
        console.log('[API TASKS POST] Назначения созданы:', assignments.length);
      } else {
        console.warn('[API TASKS POST] Нет валидных пользователей для назначения');
      }
    }

    // Получаем полную задачу с назначениями для возврата
    const taskWithAssignments = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
      },
    });

    // Логируем действие (если есть модуль audit)
    try {
      if (audit?.create) {
        await audit.create(userId, 'Task', task.id, taskWithAssignments, request);
      }
    } catch (auditError) {
      console.warn('[API TASKS POST] Ошибка логирования:', auditError);
    }

    return NextResponse.json(
      {
        message: 'Задача успешно создана',
        task: taskWithAssignments,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API TASKS POST] Ошибка:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Ошибка при создании задачи',
      },
      { status: 500 }
    );
  }
}
