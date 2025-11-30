// src/app/api/tasks/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskUpdateInput } from '@/types/task';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            userProjects: true,
          },
        },
        group: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        delegations: {
          include: {
            fromUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            toUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const taskId = parseInt(id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            userProjects: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Check permissions
    const isCreator = task.creatorId === user.id;
    const isProjectAdmin = task.project.userProjects.some(
      (up: any) => up.userId === user.id && (up.role === 'ADMIN' || up.role === 'SUPER_ADMIN')
    );
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isOwner = task.project.ownerId === user.id;

    if (!isCreator && !isProjectAdmin && !isSuperAdmin && !isOwner) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedHours,
      actualHours,
      assigneeIds,
    }: TaskUpdateInput = await request.json();

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(actualHours !== undefined && { actualHours }),
      },
      include: {
        project: true,
        group: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // Update assignments if provided
    if (assigneeIds) {
      // Delete old assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: updatedTask.id },
      });

      // Create new assignments
      if (assigneeIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: assigneeIds.map((userId: number) => ({
            taskId: updatedTask.id,
            userId,
            assignedBy: user.id,
          })),
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const taskId = parseInt(id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            userProjects: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Check permissions
    const isCreator = task.creatorId === user.id;
    const isProjectAdmin = task.project.userProjects.some(
      (up: any) => up.userId === user.id && (up.role === 'ADMIN' || up.role === 'SUPER_ADMIN')
    );
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isOwner = task.project.ownerId === user.id;

    if (!isCreator && !isProjectAdmin && !isSuperAdmin && !isOwner) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
