// src/app/api/user/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { selectedProjectId } = body;

    if (!selectedProjectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 🎯 СОХРАНЯЕМ В БАЗУ ДАННЫХ (реальное приложение)
    await prisma.user.update({
      where: {
        id: parseInt(session.user.id),
      },
      data: {
        // 🎯 В реальной схеме нужно добавить поле preferredProjectId
        // temporary: используем поле avatar для демо (в реальном приложении добавим нужное поле)
        avatar: selectedProjectId.toString(),
      },
    });

    // 🎯 ТАКЖЕ СОХРАНЯЕМ В COOKIES для быстрого доступа
    const response = NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
    });

    response.cookies.set('selectedProjectId', selectedProjectId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 🎯 ДОБАВЛЯЕМ GET endpoint для получения настроек
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🎯 ПОЛУЧАЕМ НАСТРОЙКИ ИЗ БАЗЫ ДАННЫХ
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        // temporary: используем поле avatar для демо
        avatar: true,
      },
    });

    const selectedProjectId = user?.avatar ? parseInt(user.avatar) : null;

    return NextResponse.json({
      selectedProjectId,
      // 🎯 МОЖНО ДОБАВИТЬ ДРУГИЕ НАСТРОЙКИ
      theme: 'light', // пример другой настройки
      language: 'ru', // пример другой настройки
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
