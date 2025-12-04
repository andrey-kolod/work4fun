// work4fun/src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { PermissionService } from '@/lib/services/permissionService';

// Вспомогательная функция для безопасного приведения visibleGroups к массиву строк
const parseVisibleGroups = (visibleGroups: any): string[] => {
  if (!visibleGroups) return [];

  try {
    // Если это уже массив
    if (Array.isArray(visibleGroups)) {
      return visibleGroups.map((item: any) => String(item));
    }

    // Если это JSON строка
    if (typeof visibleGroups === 'string') {
      const parsed = JSON.parse(visibleGroups);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => String(item));
      }
    }

    return [];
  } catch (error) {
    console.error('Error parsing visibleGroups:', error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('[API TASKS] Получение задач с фильтрацией по правам');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('[API TASKS] Не авторизован');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const groupId = searchParams.get('groupId');

    console.log('[API TASKS] Параметры:', {
      projectId,
      groupId,
      userId: session.user.id,
      role: session.user.role,
    });

    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    // 1. SUPER_ADMIN видит все задачи всех проектов без ограничений
    if (userRole === 'SUPER_ADMIN') {
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
        orderBy: [{ createdAt: 'desc' }, { status: 'asc' }, { dueDate: 'asc' }],
      });

      console.log(`[API TASKS SUPER_ADMIN] Найдено задач: ${tasks.length}`);
      return NextResponse.json({ tasks });
    }

    // 2. Обычные пользователи и ADMIN - нужна проверка прав
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId обязателен для пользователей' },
        { status: 400 }
      );
    }

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    // Проверяем доступ пользователя к проекту
    const canViewProject = await PermissionService.canViewProject(userId, projectIdNum);
    if (!canViewProject) {
      console.log('[API TASKS] Нет доступа к проекту');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Получаем информацию о доступе пользователя к проекту
    const userAccess = await prisma.userProject.findFirst({
      where: {
        userId: userId,
        projectId: projectIdNum,
      },
    });

    if (!userAccess) {
      return NextResponse.json({ error: 'Access information not found' }, { status: 403 });
    }

    // Строим условия WHERE в зависимости от scope пользователя
    const where: any = { projectId: projectIdNum };

    // Если запрошены задачи конкретной группы
    if (groupId) {
      const groupIdNum = parseInt(groupId);
      if (isNaN(groupIdNum)) {
        return NextResponse.json({ error: 'Invalid groupId' }, { status: 400 });
      }

      // Проверяем доступ к конкретной группе
      if (userAccess.scope === 'SPECIFIC_GROUPS') {
        const visibleGroups = parseVisibleGroups(userAccess.visibleGroups);
        const canViewGroup = visibleGroups.includes(groupIdNum.toString());
        if (!canViewGroup) {
          console.log('[API TASKS] Нет доступа к группе:', groupId);
          return NextResponse.json({ error: 'Access denied to group' }, { status: 403 });
        }
      }

      where.groupId = groupIdNum;
    }
    // Если запрошены все задачи проекта
    else {
      // Для пользователей с ограниченным доступом фильтруем по visibleGroups
      if (userAccess.scope === 'SPECIFIC_GROUPS') {
        const visibleGroups = parseVisibleGroups(userAccess.visibleGroups);

        if (visibleGroups.length > 0) {
          const visibleGroupIds = visibleGroups
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id));

          if (visibleGroupIds.length > 0) {
            where.groupId = { in: visibleGroupIds };
          } else {
            console.log('[API TASKS] Нет доступных групп у пользователя');
            return NextResponse.json({ tasks: [] });
          }
        } else {
          console.log('[API TASKS] Нет доступных групп у пользователя');
          return NextResponse.json({ tasks: [] });
        }
      }
      // Для пользователей с scope='ALL' фильтрации нет - видят все задачи проекта
    }

    console.log('[API TASKS] WHERE условия после фильтрации:', where);

    // Получаем задачи с учетом фильтрации
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
      orderBy: [{ createdAt: 'desc' }, { status: 'asc' }, { dueDate: 'asc' }],
    });

    console.log(`[API TASKS] Найдено задач после фильтрации: ${tasks.length}`);
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

    // Проверка прав с использованием PermissionService
    if (session.user.role !== 'SUPER_ADMIN') {
      const canEdit = await PermissionService.canEditProject(userId, projectId);
      if (!canEdit) {
        console.log('[API TASKS POST] Нет прав на создание задачи в проекте');
        return NextResponse.json({ error: 'Нет прав на создание задачи' }, { status: 403 });
      }
    }

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Если указана группа, проверяем доступ к ней
    if (data.groupId && session.user.role !== 'SUPER_ADMIN') {
      const canViewGroup = await PermissionService.canViewGroupTasks(userId, data.groupId);
      if (!canViewGroup) {
        console.log('[API TASKS POST] Нет доступа к группе:', data.groupId);
        return NextResponse.json({ error: 'Нет доступа к указанной группе' }, { status: 403 });
      }
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

    // Если есть назначенные пользователи
    const assigneeIds = data.assigneeIds || data.assignedTo || [];

    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      console.log('[API TASKS POST] Назначение пользователей:', assigneeIds);

      // Преобразуем все ID в числа
      const numericAssigneeIds = assigneeIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));

      if (numericAssigneeIds.length > 0) {
        // Проверяем, что все пользователи существуют и имеют доступ к проекту
        const validUsers = await prisma.userProject.findMany({
          where: {
            userId: { in: numericAssigneeIds },
            projectId: projectId,
            isActive: true,
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

    // Логируем действие
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
