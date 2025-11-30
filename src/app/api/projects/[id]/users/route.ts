// src/app/api/projects/[id]/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// POST /api/projects/[id]/users - Добавить пользователя в проект
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Добавляем пользователя в проект
    const userProject = await prisma.userProject.create({
      data: {
        userId: parseInt(userId),
        projectId: parseInt(id),
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
    });

    // Логируем действие
    await audit.create(
      parseInt(session.user.id),
      'Project',
      project.id,
      {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'USER_ADDED_TO_PROJECT',
      },
      request
    );

    return NextResponse.json({ userProject }, { status: 201 });
  } catch (error) {
    console.error('Error adding user to project:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении пользователя в проект' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/users - Получить пользователей проекта
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const users = await prisma.userProject.findMany({
      where: {
        projectId: parseInt(id),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching project users:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей проекта' },
      { status: 500 }
    );
  }
}
