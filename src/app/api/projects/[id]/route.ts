// app/api/projects/[id]/route.ts - ДОБАВИМ GET МЕТОД
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';

// GET /api/projects/[id] - Получить проект по ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Получаем проект
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        userProjects: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        groups: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Обновление проекта
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { name, description, status, ownerId, startDate, endDate } = body;

    // Получаем текущие данные проекта
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!currentProject) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    // Обрабатываем ownerId - устанавливаем null если передано пустое значение
    if (ownerId !== undefined) {
      updateData.ownerId = ownerId && !isNaN(parseInt(ownerId)) ? parseInt(ownerId) : null;
    }

    // Обрабатываем даты
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    // Обновляем проект
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Логируем действие
    await audit.update(
      parseInt(session.user.id),
      'Project',
      projectId,
      {
        name: currentProject.name,
        description: currentProject.description,
        status: currentProject.status,
        ownerId: currentProject.ownerId,
        startDate: currentProject.startDate,
        endDate: currentProject.endDate,
      },
      {
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        ownerId: updatedProject.ownerId,
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate,
      },
      request
    );

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении проекта' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Удаление проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Только SUPER_ADMIN может удалять проекты
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    // Получаем данные проекта перед удалением
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!projectToDelete) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Удаляем проект
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Логируем действие
    await audit.delete(
      parseInt(session.user.id),
      'Project',
      projectId,
      {
        name: projectToDelete.name,
        description: projectToDelete.description,
        status: projectToDelete.status,
        ownerId: projectToDelete.ownerId,
      },
      request
    );

    return NextResponse.json({ message: 'Проект удален успешно' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Ошибка при удалении проекта' }, { status: 500 });
  }
}
