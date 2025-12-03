import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params; // ⬅️ ВАЖНО: await для Next.js 15

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const taskId = parseInt(id);

    // Получаем задачу
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
        project: {
          include: {
            userProjects: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа для изменения статуса
    const isAssignee = task.assignments.some((a) => a.userId === user.id);
    const isCreator = task.creatorId === user.id;
    const isProjectAdmin = task.project.userProjects.some(
      (up) => up.userId === user.id && (up.role === 'ADMIN' || up.role === 'SUPER_ADMIN')
    );
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    // Для смены статуса достаточно быть исполнителем, создателем или админом
    if (!isAssignee && !isCreator && !isProjectAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: 'Нет прав для изменения статуса задачи',
        },
        { status: 403 }
      );
    }

    // Получаем новый статус из тела запроса
    const { status } = await request.json();

    // Валидация статуса
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Неверный статус. Допустимые значения: TODO, IN_PROGRESS, REVIEW, DONE',
        },
        { status: 400 }
      );
    }

    // Обновляем статус задачи
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        group: true,
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
    });

    // Логируем изменение статуса
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: 'TASK_STATUS_CHANGED',
        entityType: 'Task',
        entityId: taskId,
        oldValues: JSON.stringify({ status: task.status }),
        newValues: JSON.stringify({ status: status }),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении статуса задачи' }, { status: 500 });
  }
}
