// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/projects - Получение списка проектов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем проекты, доступные пользователю
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: parseInt(session.user.id) },
          { userProjects: { some: { userId: parseInt(session.user.id) } } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Ошибка при получении проектов' }, { status: 500 });
  }
}

// POST /api/projects - Создание проекта
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, status, ownerId, startDate, endDate } = body;

    // Валидация
    if (!name) {
      return NextResponse.json({ error: 'Название проекта обязательно' }, { status: 400 });
    }

    // Подготавливаем данные для создания
    const projectData: any = {
      name,
      description: description || null,
      status: status || 'ACTIVE',
    };

    // Добавляем ownerId только если он предоставлен
    if (ownerId && !isNaN(parseInt(ownerId))) {
      projectData.ownerId = parseInt(ownerId);
    }

    // Добавляем даты если они предоставлены
    if (startDate) {
      projectData.startDate = new Date(startDate);
    }
    if (endDate) {
      projectData.endDate = new Date(endDate);
    }

    // Создаем проект
    const project = await prisma.project.create({
      data: projectData,
    });

    // Логируем действие
    await audit.create(
      parseInt(session.user.id),
      'Project',
      project.id,
      { name, description, status, ownerId, startDate, endDate },
      request
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Ошибка при создании проекта' }, { status: 500 });
  }
}
