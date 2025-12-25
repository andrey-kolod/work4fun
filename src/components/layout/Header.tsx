// src/components/layout/Header.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLayout } from '@/contexts/LayoutContext';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();
  const { shouldShowSidebar } = useLayout();

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const getUserName = () => {
    if (!session?.user) return '';
    const user = session.user as any;
    return user.firstName || user.name || user.email?.split('@')[0] || 'Пользователь';
  };

  const getUserInitials = () => {
    if (!session?.user) return 'U';
    const user = session.user as any;
    return user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  const userAvatar = session?.user?.avatar;
  const initials = getUserInitials();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Закрытие меню пользователя при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [userMenuOpen]);

  if (!mounted || status === 'loading') {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded" />
            <div className="h-8 w-24 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

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
      setUserMenuOpen(false);
    }
  };

  const goToDashboard = () => {
    if (selectedProject) {
      router.push(`/dashboard?projectId=${selectedProject.id}`);
    }
  };

  const goToKanban = () => {
    if (selectedProject) {
      router.push(`/tasks?projectId=${selectedProject.id}`);
    }
  };

  const userRole = session?.user ? (session.user as any).role : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Левая часть */}
          <div className="flex items-center gap-3">
            {/* Кнопка сайдбара */}
            {shouldShowSidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                  sidebarOpen
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
                aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-navigation"
              >
                {/* Простая иконка гамбургера - без анимации */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
            <Link
              href="/tasks"
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg px-2 py-1"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Work4Fun
              </span>
            </Link>

            {/* Навигационные кнопки */}
            {shouldShowSidebar && selectedProject && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Button
                  onClick={goToKanban}
                  variant={pathname.startsWith('/tasks') ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <span>✅</span>
                  Kanban
                </Button>

                <Button
                  onClick={goToDashboard}
                  variant={pathname.startsWith('/dashboard') ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <span>📊</span>
                  Dashboard
                </Button>
              </div>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-4" ref={userMenuRef}>
            {/* Название проекта */}
            {selectedProject && shouldShowSidebar && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                  {selectedProject.name}
                </span>
              </div>
            )}

            {/* Меню пользователя */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  'flex items-center gap-3 p-1.5 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                  userMenuOpen ? 'bg-purple-50 ring-2 ring-purple-200' : 'hover:bg-gray-100'
                )}
                aria-label="Меню пользователя"
                aria-expanded={userMenuOpen}
              >
                {/* Аватар */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center border border-purple-200">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={getUserName()}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-600 font-medium text-sm">{initials}</span>
                  )}
                </div>

                {/* Информация о пользователе (скрыта на мобильных) */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                    {getUserName()}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userRole?.toLowerCase().replace('_', ' ') || 'пользователь'}
                  </span>
                </div>

                {/* Стрелочка */}
                <svg
                  className={cn(
                    'w-4 h-4 text-gray-500 transition-transform duration-200',
                    userMenuOpen ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Выпадающее меню */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* Информация пользователя */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">{getUserName()}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {userRole?.toLowerCase().replace('_', ' ') || 'user'}
                      </span>
                    </div>
                  </div>

                  {/* Проект */}
                  {selectedProject && (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Текущий проект:</p>
                      <p className="font-medium text-gray-900 truncate">{selectedProject.name}</p>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm transition-colors',
                        'focus:outline-none focus:bg-red-50',
                        isLoading
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      )}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {isLoading ? 'Выход...' : 'Выйти из системы'}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
