// src/app/api/projects/user-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const userId = session.user.id as string;
    const userRole = session.user.role;

    // SUPER_ADMIN всегда имеет доступ к сайдбару
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.json({ count: 1 }, { status: 200 }); // Имитируем наличие проектов
    }

    // Получаем количество проектов пользователя
    const count = await prisma.projectMembership.count({
      where: {
        userId,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [API /user-count] Пользователь ${userId} имеет ${count} проектов`);
    }

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Ошибка получения количества проектов:', error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
