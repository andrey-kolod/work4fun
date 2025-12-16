// ============================================================================
// ФАЙЛ: src/middleware.ts (переименовать из proxy.ts)
// НАЗНАЧЕНИЕ: Серверная защита маршрутов и редиректы (middleware в Next.js)
// ----------------------------------------------------------------------------
// Middleware — это "промежуточный слой" на сервере: проверяет каждый запрос.
// Почему нужен (как новичку):
// - Защищает от неавторизованных (быстрее и безопаснее, чем на клиенте).
// - Автоматические редиректы (на /login или /project-select).
// - Проверяет роль для /admin.
// Работает на edge (очень быстро).
// Логи для отладки (в dev-режиме).
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Логируем для отладки (только в development)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔍 Middleware: путь ${pathname}, авторизован: ${!!token}, роль: ${token?.role || 'нет'}`
    );
  }

  // === ПУБЛИЧНЫЕ МАРШРУТЫ (доступны всем) ===
  if (
    pathname === '/' || // Главная страница (публичная по твоему коду)
    pathname.startsWith('/login') || // Страница входа
    pathname.startsWith('/register') || // Регистрация (если добавишь)
    pathname.startsWith('/password/reset') || // Восстановление пароля (по PRD)
    pathname.startsWith('/api/auth') || // API NextAuth
    pathname.startsWith('/_next') || // Статические файлы Next.js
    pathname.startsWith('/public') || // Публичные файлы
    pathname.startsWith('/favicon.ico') || // Иконка
    pathname === '/no-projects' // Страница "нет проектов"
  ) {
    // Если авторизован и на /login — редирект на выбор проекта
    if (token && pathname.startsWith('/login')) {
      console.log('✅ Уже авторизован на /login — редирект на /project-select');
      return NextResponse.redirect(new URL('/project-select', request.url));
    }
    return NextResponse.next();
  }

  // === ЗАЩИТА /project-select (только авторизованным) ===
  if (pathname.startsWith('/project-select')) {
    if (!token) {
      console.log('❌ Нет токена на /project-select — редирект на /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // === ЗАЩИТА /dashboard и /tasks (только авторизованным + выбран проект) ===
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    if (!token) {
      console.log('❌ Нет токена в защищённой зоне — редирект на /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Проверяем выбранный проект (по куки, как в твоём коде)
    const selectedProjectId = request.cookies.get('selectedProjectId')?.value;
    if (!selectedProjectId && pathname === '/dashboard') {
      // Или /tasks если нужно
      console.log('[MIDDLEWARE] Нет выбранного проекта — редирект на /project-select');
      return NextResponse.redirect(new URL('/project-select', request.url));
    }
    return NextResponse.next();
  }

  // === ОБЩАЯ ПРОВЕРКА ТОКЕНА (для всех остальных маршрутов) ===
  if (!token) {
    console.log('❌ Нет токена — редирект на /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === ЗАЩИТА АДМИНКИ ===
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'PROJECT_LEAD') {
      // По твоему enum Role (PROJECT_LEAD — админ проекта?)
      console.log(`❌ Недостаточно прав для /admin (роль: ${token.role})`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // === API АДМИН ЗАЩИТА ===
  if (pathname.startsWith('/api/admin')) {
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'PROJECT_LEAD') {
      console.log(`❌ Forbidden для /api/admin (роль: ${token.role})`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Всё ок — пропускаем запрос
  return NextResponse.next();
}

// Применяем middleware ко всем маршрутам кроме статических
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
