// src/app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { audit } from '@/lib/audit';

// GET /api/users - Получить список пользователей
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверка прав - только админы и супер-админы
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const group = searchParams.get('group') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Базовый запрос с фильтрами
    const where: any = {};

    // Фильтр по поиску (email, имя, фамилия)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Фильтр по роли
    if (role) {
      where.role = role;
    }

    // Фильтр по статусу
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Фильтр по группе
    let groupFilter = {};
    if (group) {
      groupFilter = {
        userGroups: {
          some: {
            groupId: parseInt(group),
          },
        },
      };
    }

    // Объединяем все условия
    const finalWhere = {
      ...where,
      ...(Object.keys(groupFilter).length > 0 ? groupFilter : {}),
    };

    // Получаем общее количество пользователей для пагинации
    const totalUsers = await prisma.user.count({
      where: finalWhere,
    });

    // Получаем пользователей с пагинацией
    const users = await prisma.user.findMany({
      where: finalWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        // Добавляем связанные группы
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
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Формируем ответ
    const usersWithFormattedDate = users.map((user) => ({
      ...user,
      // Конвертируем Date в строку для JSON
      createdAt: user.createdAt.toISOString(),
      // Формируем полное имя
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    }));

    return NextResponse.json({
      users: usersWithFormattedDate,
      pagination: {
        page,
        pageSize,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Ошибка при получении пользователей' }, { status: 500 });
  }
}

// POST /api/users - Создать нового пользователя или пригласить существующего
export async function POST(request: NextRequest) {
  try {
    console.log('=== СОЗДАНИЕ/ПРИГЛАШЕНИЕ ПОЛЬЗОВАТЕЛЯ ===');

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Не авторизован');
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    console.log('Сессия админа:', { userId: session.user.id, role: session.user.role });

    // Только админы и супер-админы могут создавать/приглашать пользователей
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      console.log('❌ Доступ запрещен, роль:', session.user.role);
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Полученные данные:', body);

    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      avatar,
      role = 'USER',
      projectId,
      scope = 'ALL',
      visibleGroups = [],
      isActive = true,
    } = body;

    // Валидация обязательных полей
    if (!email || !projectId) {
      console.log('❌ Обязательные поля отсутствуют:', {
        email: !!email,
        projectId: !!projectId,
      });
      return NextResponse.json({ error: 'Email и проект обязательны' }, { status: 400 });
    }

    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Неверный формат email:', email);
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 });
    }

    // Проверка существования проекта
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      console.log('❌ Проект не найден:', projectId);
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    console.log('✅ Проект найден:', project.name);

    // Проверяем существование пользователя
    let existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let user;
    let isNewUser = false;
    let action = 'приглашен'; // или 'создан'

    // Если пользователь существует - приглашаем его в проект
    if (existingUser) {
      console.log('ℹ️ Пользователь уже существует, приглашаем в проект:', email);
      user = existingUser;
      action = 'приглашен';

      // Проверяем, не добавлен ли уже пользователь в этот проект
      const existingUserProject = await prisma.userProject.findFirst({
        where: {
          userId: user.id,
          projectId: parseInt(projectId),
        },
      });

      if (existingUserProject) {
        console.log('⚠️ Пользователь уже в этом проекте');
        return NextResponse.json(
          {
            error: 'Пользователь уже добавлен в этот проект',
            user: {
              ...user,
              password: undefined,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            },
          },
          { status: 400 }
        );
      }
    } else {
      // Если пользователя нет - создаем нового
      console.log('🆕 Пользователя нет, создаем нового');

      // Для нового пользователя пароль обязателен
      if (!password) {
        console.log('❌ Пароль обязателен для нового пользователя');
        return NextResponse.json(
          { error: 'Пароль обязателен для нового пользователя' },
          { status: 400 }
        );
      }

      // Хеширование пароля
      const hashedPassword = await hash(password, 12);
      console.log('Пароль захеширован');

      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName || '',
          lastName: lastName || '',
          middleName: middleName || '',
          phone: phone || '',
          avatar: avatar || '',
          role: role,
          isActive: isActive,
        },
      });

      isNewUser = true;
      action = 'создан';
      console.log('✅ Новый пользователь создан, ID:', user.id);
    }

    // Создаем связь пользователя с проектом (UserProject)
    console.log('Создание UserProject...');

    // Преобразуем visibleGroups в правильный формат для JSON
    let formattedVisibleGroups: any = [];
    if (scope === 'SPECIFIC_GROUPS' && Array.isArray(visibleGroups)) {
      // Если groups переданы как строки, преобразуем в числа
      formattedVisibleGroups = visibleGroups.map((groupId) => {
        const num = parseInt(String(groupId));
        return isNaN(num) ? groupId : num;
      });
    }

    const userProject = await prisma.userProject.create({
      data: {
        userId: user.id,
        projectId: parseInt(projectId),
        role: role,
        scope: scope,
        visibleGroups: formattedVisibleGroups,
        isActive: true,
      },
    });

    console.log('✅ UserProject создан:', userProject.id);

    // Если нужно, добавляем пользователя в группы (UserGroup)
    if (scope === 'SPECIFIC_GROUPS' && Array.isArray(visibleGroups) && visibleGroups.length > 0) {
      console.log('Добавление пользователя в группы...');

      const groupConnections = visibleGroups.map((groupId) => ({
        userId: user.id,
        groupId: parseInt(String(groupId)),
      }));

      // Используем upsert для избежания дубликатов
      for (const connection of groupConnections) {
        await prisma.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: connection.userId,
              groupId: connection.groupId,
            },
          },
          update: {}, // ничего не обновляем если уже существует
          create: connection,
        });
      }

      console.log(`✅ Пользователь добавлен в ${groupConnections.length} групп`);
    }

    // Логируем действие
    try {
      if (audit?.create) {
        await audit.create(
          parseInt(session.user.id),
          'UserProject',
          userProject.id,
          {
            email,
            firstName: user.firstName,
            lastName: user.lastName,
            role,
            projectId,
            projectName: project.name,
            scope,
            isNewUser,
            action,
          },
          request
        );
      }
    } catch (auditError) {
      console.warn('Ошибка при логировании:', auditError);
    }

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ Пользователь успешно ${action} и добавлен в проект`);
    return NextResponse.json(
      {
        message: `Пользователь успешно ${action} и добавлен в проект "${project.name}"`,
        user: {
          ...userWithoutPassword,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        project: {
          id: project.id,
          name: project.name,
        },
        userProject: {
          id: userProject.id,
          role: userProject.role,
          scope: userProject.scope,
          visibleGroups: userProject.visibleGroups,
        },
        isNewUser,
      },
      { status: isNewUser ? 201 : 200 }
    );
  } catch (error) {
    console.error('❌ Error creating/inviting user:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Ошибка при создании/приглашении пользователя',
      },
      { status: 500 }
    );
  }
}
