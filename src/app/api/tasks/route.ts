// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskCreateInput } from '@/types/task';

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user?.email) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const projectId = searchParams.get('projectId');
//     const groupId = searchParams.get('groupId');
//     const status = searchParams.get('status');
//     const assigneeId = searchParams.get('assigneeId');
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '10');

//     const where: any = {};

//     if (projectId) where.projectId = parseInt(projectId);
//     if (groupId) where.groupId = parseInt(groupId);
//     if (status) where.status = status;

//     if (assigneeId) {
//       where.assignments = {
//         some: {
//           userId: parseInt(assigneeId),
//         },
//       };
//     }

//     const tasks = await prisma.task.findMany({
//       where,
//       include: {
//         project: true,
//         group: true,
//         creator: {
//           select: { id: true, firstName: true, lastName: true, email: true },
//         },
//         assignments: {
//           include: {
//             user: {
//               select: { id: true, firstName: true, lastName: true, email: true },
//             },
//           },
//         },
//         _count: {
//           select: { comments: true, delegations: true },
//         },
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//       orderBy: { createdAt: 'desc' },
//     });

//     const total = await prisma.task.count({ where });

//     return NextResponse.json({
//       tasks,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Увеличим лимит для Kanban

    // Базовый where запрос - пользователь должен иметь доступ к задаче
    const where: any = {
      OR: [
        // Задачи где пользователь создатель
        { creatorId: user.id },
        // Задачи где пользователь назначен
        { assignments: { some: { userId: user.id } } },
        // Задачи в проектах где пользователь администратор
        {
          project: {
            userProjects: {
              some: {
                userId: user.id,
                role: { in: ['ADMIN', 'SUPER_ADMIN'] },
              },
            },
          },
        },
      ],
    };

    if (projectId) where.projectId = parseInt(projectId);
    if (groupId) where.groupId = parseInt(groupId);
    if (status) where.status = status;

    if (assigneeId) {
      where.assignments = {
        some: {
          userId: parseInt(assigneeId),
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        group: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        delegations: {
          where: {
            OR: [{ status: 'PENDING' }, { status: 'ACCEPTED' }],
          },
          include: {
            fromUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            toUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        comments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            comments: true,
            delegations: true,
            assignments: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.task.count({ where });

    return NextResponse.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const {
      title,
      description,
      projectId,
      groupId,
      dueDate,
      estimatedHours,
      priority,
      assigneeIds,
    }: TaskCreateInput = await request.json();

    // Check project permissions
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        userProjects: {
          include: { user: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const isAdmin = project.userProjects.some(
      (up: any) => up.userId === user.id && (up.role === 'ADMIN' || up.role === 'SUPER_ADMIN')
    );
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isOwner = project.ownerId === user.id;

    if (!isAdmin && !isSuperAdmin && !isOwner) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        groupId: groupId || null,
        creatorId: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        priority: priority || 'MEDIUM',
        assignments: {
          create: assigneeIds.map((userId: number) => ({
            userId,
            assignedBy: user.id,
          })),
        },
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
