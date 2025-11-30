// src/app/api/projects/[id]/users/[userId]/route.ts
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

    const userProject = await prisma.userProject.findFirst({
      where: {
        projectId: parseInt(id),
        userId: parseInt(userId),
      },
      include: {
        user: true,
        project: true,
      },
    });

    if (!userProject) {
      return NextResponse.json({ error: 'Пользователь не найден в проекте' }, { status: 404 });
    }

    await prisma.userProject.delete({
      where: {
        id: userProject.id,
      },
    });

    // Логируем действие
    await audit.delete(
      parseInt(session.user.id),
      'Project',
      userProject.projectId,
      {
        userId: userProject.user.id,
        userName: `${userProject.user.firstName} ${userProject.user.lastName}`,
        action: 'USER_REMOVED_FROM_PROJECT',
      },
      request
    );

    return NextResponse.json({ message: 'Пользователь удален из проекта' });
  } catch (error) {
    console.error('Error removing user from project:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя из проекта' },
      { status: 500 }
    );
  }
}
