// src/app/api/projects/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // 🔧 Добавляем Promise
) {
  try {
    const { userId: userIdStr } = await params; // 🔧 Ожидаем params
    const userId = parseInt(userIdStr);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Получаем проекты пользователя через связь UserProject
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            ownerId: true,
          },
        },
      },
    });

    // Супер-админ может видеть все активные проекты
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    let projects;

    if (user?.role === 'SUPER_ADMIN') {
      // Супер-админ видит все активные проекты
      projects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          ownerId: true,
        },
      });
    } else {
      // Обычный пользователь видит только свои проекты
      projects = userProjects.map((up) => up.project).filter((p) => p.status === 'ACTIVE');
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch user projects' }, { status: 500 });
  }
}
