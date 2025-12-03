// app/api/groups/[id]/route.ts - ОБЪЕДИНЕННАЯ ВЕРСИЯ
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/groups/[id] - Получить группу по ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    // Форматируем ответ
    const formattedGroup = {
      ...group,
      users: group.users.map((ug) => ug.user),
      userCount: group._count.users,
      taskCount: group._count.tasks,
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Ошибка при получении группы' }, { status: 500 });
  }
}

// PUT /api/groups/[id] - Обновить группу
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Получаем текущую группу для логирования
    const currentGroup = await prisma.group.findUnique({
      where: { id: parseInt(id) },
    });

    if (!currentGroup) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
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

    // Логируем изменения с правильным типом userId
    await audit.update(
      parseInt(session.user.id),
      'Group',
      updatedGroup.id,
      {
        name: currentGroup.name,
        description: currentGroup.description,
      },
      {
        name,
        description,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении группы' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Удалить группу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    console.log('DELETE request for group:', id);
    console.log('User role:', session.user.role);

    // Только SUPER_ADMIN может удалять группы
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: true,
        tasks: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    console.log('Group users count:', group.users.length);
    console.log('Group tasks count:', group.tasks.length);

    // Проверяем, есть ли связанные данные
    if (group.users.length > 0) {
      return NextResponse.json(
        { error: 'Невозможно удалить группу с пользователями' },
        { status: 400 }
      );
    }

    if (group.tasks.length > 0) {
      return NextResponse.json({ error: 'Невозможно удалить группу с задачами' }, { status: 400 });
    }

    await prisma.group.delete({
      where: { id: parseInt(id) },
    });

    console.log('Group deleted successfully');

    // Логируем действие с правильным типом userId
    await audit.delete(
      parseInt(session.user.id),
      'Group',
      group.id,
      {
        name: group.name,
        description: group.description,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ message: 'Группа удалена' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении группы: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
