// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Используем signOut из next-auth
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔧 Скрываем хедер на публичных страницах
  const hideHeaderPaths = ['/', '/login'];
  const shouldHideHeader = hideHeaderPaths.includes(pathname);

  // Показываем скелетон пока проверяется сессия
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

  // Скрываем хедер если страница публичная
  if (shouldHideHeader) {
    return null;
  }

  // Если нет сессии - не показываем хедер (будет редирект через middleware)
  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({
        redirect: false,
        callbackUrl: '/login',
      });
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Функции для навигации
  const goToDashboard = () => {
    if (selectedProject) {
      router.push(`/dashboard?projectId=${selectedProject.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  const goToKanban = () => {
    if (selectedProject) {
      router.push(`/tasks?projectId=${selectedProject.id}`);
    } else {
      router.push('/tasks');
    }
  };

  // 🔧 Безопасное получение данных пользователя
  const getUserName = () => {
    if (!session?.user) return '';
    const user = session.user as any;
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    return 'Пользователь';
  };

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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Левая часть: меню и логотип */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Меню"
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

            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-600">Work4Fun</span>
            </Link>

            {/* Кнопка Dashboard */}
            <Button
              onClick={goToDashboard}
              variant={pathname.startsWith('/dashboard') ? 'primary' : 'ghost'}
              className="hidden md:flex items-center gap-2"
            >
              <span>📊</span>
              Dashboard
            </Button>

            {/* Кнопка Kanban доски */}
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

          {/* Правая часть: пользователь и кнопки */}
          <div className="flex items-center gap-4">
            {/* Информация о проекте */}
            {selectedProject && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-sm font-medium text-gray-700">{selectedProject.name}</span>
              </div>
            )}

            {/* Имя пользователя */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{getUserName()}</span>
              <span className="text-xs text-gray-500 capitalize">
                {(session.user as any).role?.toLowerCase().replace('_', ' ') || 'user'}
              </span>
            </div>

            {/* Аватар */}
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium">{getUserInitials()}</span>
            </div>

            {/* Кнопка выхода */}
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
