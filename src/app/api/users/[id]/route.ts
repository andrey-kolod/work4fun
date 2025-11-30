// src/app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/users/[id] - Получить пользователя по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true,
        userGroups: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Ошибка при получении пользователя' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Обновить пользователя
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, role } = body;

    // Получаем текущего пользователя для логирования изменений
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: {
        firstName,
        lastName,
        role,
      },
    });

    // Логируем изменения с правильным получением IP
    await audit.update(
      parseInt(session.user.id),
      'User',
      updatedUser.id,
      {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        role: currentUser.role,
      },
      {
        firstName,
        lastName,
        role,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении пользователя' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Удалить пользователя (только SUPER_ADMIN)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Мягкое удаление
    await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { deletedAt: new Date() },
    });

    // Логируем действие с правильным получением IP
    await audit.delete(
      parseInt(session.user.id),
      'User',
      user.id,
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      request,
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Ошибка при удалении пользователя' }, { status: 500 });
  }
}
