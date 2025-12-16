// ============================================================================
// ФАЙЛ: src/components/layout/Header.tsx
// НАЗНАЧЕНИЕ: Шапка сайта (верхняя панель) — видна только авторизованным пользователям
// ----------------------------------------------------------------------------
// Что здесь происходит (для новичка — строка за строкой):
// 1. 'use client' — компонент работает в браузере (нужно для useSession, useState и т.д.)
// 2. useSession — проверяет, залогинен ли пользователь
// 3. Кнопка "Выйти" — вызывает signOut() от NextAuth и кидает на /login
// 4. Показывает имя пользователя, роль, аватарку, текущий проект
// 5. Кнопки Dashboard и Kanban — быстрый переход
// 6. Меню-бургер — открывает/закрывает боковую панель (Sidebar)
// 7. Хедер скрывается на публичных страницах (/login, /)
// ============================================================================

'use client'; // Этот компонент работает в браузере (клиентский)

import React, { useState, useEffect } from 'react'; // React — основа, useState — для хранения данных, useEffect — выполняется после загрузки
import Link from 'next/link'; // Link — ссылка, которая не перезагружает страницу
import { useSession, signOut } from 'next-auth/react'; // useSession — проверяет сессию, signOut — выходит из аккаунта
import { useRouter, usePathname } from 'next/navigation'; // useRouter — переходы, usePathname — текущий URL
import { useAppStore } from '@/store/useAppStore'; // Твой глобальный стейт (zustand) — хранит выбранный проект и состояние сайдбара
import { Button } from '@/components/ui/Button'; // Твоя красивая кнопка

// Header — это функция, которая возвращает HTML шапки
const Header: React.FC = () => {
  // useSession — хук от NextAuth: даёт session (данные пользователя) и status (loading/authenticated/unauthenticated)
  const { data: session, status } = useSession();

  const router = useRouter(); // Для переходов по страницам
  const pathname = usePathname(); // Текущий URL (например, /dashboard)

  // Достаём данные из твоего глобального стора (zustand)
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();

  const [isLoading, setIsLoading] = useState(false); // true — когда идёт выход (крутим спиннер)
  const [mounted, setMounted] = useState(false); // true — когда компонент загрузился в браузере

  // useEffect — выполняется один раз после загрузки компонента
  useEffect(() => {
    setMounted(true); // Теперь можно показывать реальное содержимое (избегаем hydration error)
  }, []);

  // Список страниц, где хедер НЕ показывается (публичные)
  const hideHeaderPaths = ['/', '/login', '/register', '/password/reset'];
  const shouldHideHeader = hideHeaderPaths.includes(pathname);

  // Пока идёт проверка сессии — показываем "скелетон" (серые плашки вместо текста)
  if (!mounted || status === 'loading') {
    return (
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Логотип — серая плашка */}
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            {/* Кнопка выхода — серая плашка */}
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  // Если страница публичная (например, /login) — хедер не показываем
  if (shouldHideHeader) {
    return null; // Ничего не рендерим
  }

  // Если пользователь не залогинен — хедер не показываем (middleware уже редиректит)
  if (!session) {
    return null;
  }

  // Функция выхода из аккаунта
  const handleLogout = async () => {
    try {
      setIsLoading(true); // Включаем спиннер
      console.log('🔓 Начинаем выход из аккаунта...');

      // signOut — удаляет сессию и куки
      await signOut({
        redirect: false, // Не переходим автоматически
        callbackUrl: '/login', // Куда перейти после выхода
      });

      console.log('✅ Успешный выход! Переходим на /login');
      router.push('/login'); // Переходим на страницу входа
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error);
    } finally {
      setIsLoading(false); // Выключаем спиннер
    }
  };

  // Переход на Dashboard
  const goToDashboard = () => {
    if (selectedProject) {
      router.push(`/dashboard?projectId=${selectedProject.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  // Переход на Канбан-доску
  const goToKanban = () => {
    if (selectedProject) {
      router.push(`/tasks?projectId=${selectedProject.id}`);
    } else {
      router.push('/tasks');
    }
  };

  // Получаем имя пользователя (firstName → name → email)
  const getUserName = () => {
    if (!session?.user) return '';
    const user = session.user as any;
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0]; // Берём часть до @
    return 'Пользователь';
  };

  // Инициалы для аватарки (первая буква имени или email)
  const getUserInitials = () => {
    if (!session?.user) return 'U';
    const user = session.user as any;
    if (user.firstName && user.firstName.length > 0) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      {/* sticky top-0 — хедер прилипает к верху при скролле */}
      {/* z-30 — выше всех элементов */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ЛЕВАЯ ЧАСТЬ: меню + логотип + быстрые кнопки */}
          <div className="flex items-center gap-4">
            {/* Кнопка меню (бургер) — открывает сайдбар */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Открыть меню"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Логотип — кликабельный, ведёт на дашборд */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-600">Work4Fun</span>
            </Link>

            {/* Кнопка Dashboard — подсвечивается, если мы на дашборде */}
            <Button
              onClick={goToDashboard}
              variant={pathname.startsWith('/dashboard') ? 'primary' : 'ghost'}
              className="hidden md:flex items-center gap-2"
            >
              <span>📊</span>
              Dashboard
            </Button>

            {/* Кнопка Канбан — показывается только если проект выбран */}
            {selectedProject && (
              <Button
                onClick={goToKanban}
                variant={pathname.startsWith('/tasks') ? 'primary' : 'ghost'}
                className="hidden md:flex items-center gap-2"
              >
                <span>✅</span>
                Kanban
              </Button>
            )}
          </div>

          {/* ПРАВАЯ ЧАСТЬ: проект + пользователь + выход */}
          <div className="flex items-center gap-4">
            {/* Название текущего проекта (показывается только если выбран) */}
            {selectedProject && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-700">{selectedProject.name}</span>
              </div>
            )}

            {/* Имя и роль пользователя (скрыто на мобильных) */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{getUserName()}</span>
              <span className="text-xs text-gray-500 capitalize">
                {(session.user as any).role?.toLowerCase().replace('_', ' ') || 'пользователь'}
              </span>
            </div>

            {/* Аватарка — круг с инициалом */}
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium">{getUserInitials()}</span>
            </div>

            {/* Кнопка ВЫХОД — красная */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isLoading ? 'Выход...' : 'Выйти'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
