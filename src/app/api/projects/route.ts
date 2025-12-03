// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let projects;

    if (session.user.role === 'SUPER_ADMIN') {
      // Супер-админ видит все проекты
      projects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              userProjects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } else {
      // Обычный пользователь видит только свои проекты
      projects = await prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { ownerId: parseInt(session.user.id) },
            {
              userProjects: {
                some: {
                  userId: userId ? parseInt(userId) : parseInt(session.user.id),
                },
              },
            },
          ],
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
          _count: {
            select: {
              tasks: true,
              userProjects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
// Добавьте этот код в конец src/app/api/projects/route.ts (перед закрывающей фигурной скобкой)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы и супер-админы могут создавать проекты
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, ownerId } = body;

    // Валидация
    if (!name || !ownerId) {
      return NextResponse.json({ error: 'Project name and owner are required' }, { status: 400 });
    }

    // Проверяем существование владельца
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Создаем проект
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        status: 'ACTIVE',
      },
    });

    // Добавляем владельца в проект как админа
    await prisma.userProject.create({
      data: {
        userId: ownerId,
        projectId: project.id,
        role: session.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      },
    });

    return NextResponse.json(
      {
        project,
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
