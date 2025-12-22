// src/components/layout/Header.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Страницы без хедера (публичные)
  const hideHeaderPaths = ['/', '/login', '/register', '/password/reset'];
  const shouldHideHeader = hideHeaderPaths.includes(pathname);

  // Страницы без сайдбара (и соответствующих кнопок)
  const noSidebarPaths = ['/projects', '/project-select'];
  const showSidebarElements = !noSidebarPaths.includes(pathname);

  // Получаем имя пользователя
  const getUserName = () => {
    if (!session?.user) return '';
    const user = session.user as any;
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    return 'Пользователь';
  };

  // Получаем инициалы для аватара
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

  const userAvatar = session?.user?.avatar;
  const initials = getUserInitials();

  // Монтирование
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === 'loading') {
    return (
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  if (shouldHideHeader || !session) {
    return null;
  }

  // Выход из системы
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 [Header] Начинаем выход из аккаунта...');
      }

      await signOut({
        redirect: false,
        callbackUrl: '/login',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [Header] Успешный выход! Переходим на /login');
      }

      router.push('/login');
      router.refresh(); // ИСПРАВЛЕНИЕ: Обновляем серверные данные после выхода
    } catch (error) {
      console.error('❌ [Header] Ошибка при выходе:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Переход в Dashboard
  const goToDashboard = () => {
    if (selectedProject) {
      router.push(`/dashboard?projectId=${selectedProject.id}`);
    }
  };

  // Переход в Kanban
  const goToKanban = () => {
    if (selectedProject) {
      router.push(`/tasks?projectId=${selectedProject.id}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Левая часть: кнопки навигации + логотип */}
          <div className="flex items-center gap-4">
            {/* Кнопка сайдбара (только где есть сайдбар) */}
            {showSidebarElements && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Открыть/закрыть меню"
                aria-expanded={sidebarOpen}
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
            )}

            {/* Логотип */}
            <Link href="/tasks" className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-600">Work4Fun</span>
            </Link>

            {/* Навигационные кнопки (только где есть сайдбар и выбран проект) */}
            {showSidebarElements && selectedProject && (
              <>
                <Button
                  onClick={goToKanban}
                  variant={pathname.startsWith('/tasks') ? 'primary' : 'ghost'}
                  className="hidden md:flex items-center gap-2"
                  aria-label="Перейти в Kanban"
                >
                  <span>✅</span>
                  Kanban
                </Button>

                <Button
                  onClick={goToDashboard}
                  variant={pathname.startsWith('/dashboard') ? 'primary' : 'ghost'}
                  className="hidden md:flex items-center gap-2"
                  aria-label="Перейти в Dashboard"
                >
                  <span>📊</span>
                  Dashboard
                </Button>
              </>
            )}
          </div>

          {/* Правая часть: проект + пользователь + выход */}
          <div className="flex items-center gap-4">
            {/* Название проекта (только если выбран) */}
            {selectedProject && showSidebarElements && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-700">{selectedProject.name}</span>
              </div>
            )}

            {/* Имя и роль пользователя */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{getUserName()}</span>
              <span className="text-xs text-gray-500 capitalize">
                {session.user?.role?.toLowerCase().replace('_', ' ') || 'пользователь'}
              </span>
            </div>

            {/* Аватар / инициалы */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={
                    `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() ||
                    'Аватар пользователя'
                  }
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-purple-600 font-medium text-sm">{initials}</span>
              )}
            </div>

            {/* Кнопка выхода */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Выйти из аккаунта"
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
