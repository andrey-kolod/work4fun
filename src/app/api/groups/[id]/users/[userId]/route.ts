// src/app/api/groups/[id]/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userGroup = await prisma.userGroup.findFirst({
      where: {
        groupId: parseInt(id),
        userId: parseInt(userId),
      },
      include: {
        user: true,
        group: true,
      },
    });

    if (!userGroup) {
      return NextResponse.json({ error: 'Пользователь не найден в группе' }, { status: 404 });
    }

    await prisma.userGroup.delete({
      where: {
        id: userGroup.id,
      },
    });

    // Логируем действие
    await audit.delete(
      parseInt(session.user.id),
      'Group',
      userGroup.groupId,
      {
        userId: userGroup.user.id,
        userName: `${userGroup.user.firstName} ${userGroup.user.lastName}`,
        action: 'USER_REMOVED_FROM_GROUP',
      },
      request
    );

    return NextResponse.json({ message: 'Пользователь удален из группы' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя из группы' },
      { status: 500 }
    );
  }
}
