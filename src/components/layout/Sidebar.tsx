// src/components/layout/Sidebar.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';

const ANIMATION_DURATION = 400;
const ANIMATION_DELAY_BASE = 150;
const ANIMATION_DELAY_STEP = 50;

interface CustomSessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();
  const { shouldShowSidebar } = useLayout();

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleOpen = () => {
      setIsVisible(true);
      setIsClosing(false);
    };

    const handleClose = () => {
      setIsClosing(true);
      timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
    };

    if (shouldShowSidebar && sidebarOpen) {
      timer = setTimeout(handleOpen, 0);
    } else if (isVisible) {
      handleClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sidebarOpen, shouldShowSidebar, isVisible]);

  if (!shouldShowSidebar || !isVisible) {
    return null;
  }

  const user = session?.user as CustomSessionUser | undefined;
  const userRole = user?.role || null;

  const navItems = [
    { name: 'Дашборд', href: '/dashboard', icon: '📊' },
    {
      name: 'Задачи',
      href: selectedProject ? `/tasks?projectId=${selectedProject.id}` : '/tasks',
      icon: '✅',
    },
    { name: 'Проекты', href: '/projects', icon: '📁' },
  ];

  const getDelayClass = (index: number): string => {
    const delay = ANIMATION_DELAY_BASE + index * ANIMATION_DELAY_STEP;

    const delayClasses: Record<number, string> = {
      150: 'delay-150',
      200: 'delay-200',
      250: 'delay-250',
      300: 'delay-300',
      350: 'delay-350',
      400: 'delay-400',
      450: 'delay-450',
      500: 'delay-500',
    };

    return delayClasses[delay] || '';
  };

  const getUserInitials = (): string => {
    if (!user) return 'Г';

    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'П';
  };

  const getDisplayName = (): string => {
    if (!user) return 'Гость';

    if (user.firstName) {
      return user.firstName;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Пользователь';
  };

  const getDisplayRole = (): string => {
    if (!userRole) return 'гость';

    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'супер-админ',
      ADMIN: 'администратор',
      USER: 'пользователь',
      PROJECT_OWNER: 'владелец проекта',
      PROJECT_ADMIN: 'админ проекта',
      MEMBER: 'участник',
      VIEWER: 'наблюдатель',
    };

    return roleMap[userRole] || userRole.toLowerCase().replace('_', ' ');
  };

  const handleSettingsClick = () => {
    window.location.href = '/settings';
  };

  return (
    <>
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 lg:bg-transparent
          transition-all duration-500 ease-in-out
          ${!isClosing ? 'opacity-100' : 'opacity-0'}
          ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        onClick={handleCloseSidebar}
        aria-hidden="true"
        role="presentation"
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 
          bg-white border-r border-gray-200 shadow-lg
          transform transition-all duration-${ANIMATION_DURATION} ease-in-out
          ${!isClosing ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Боковая панель навигации"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          <div
            className={`
              p-6 border-b border-gray-200
              transition-all duration-300
              ${!isClosing ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 -translate-y-2'}
            `}
          >
            <h2 className="text-xl font-bold text-gray-900">Work4Fun</h2>
            <p className="text-sm text-gray-600 mt-1">Управление проектами</p>
          </div>

          <nav className="flex-1 p-4 space-y-2" aria-label="Основная навигация">
            {navItems.map((item, index) => {
              const baseHref = item.href.split('?')[0];
              const isActive = pathname === baseHref || pathname.startsWith(`${baseHref}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    !isClosing
                      ? `opacity-100 translate-x-0 ${getDelayClass(index)}`
                      : 'opacity-0 -translate-x-4'
                  )}
                  onClick={handleCloseSidebar}
                  aria-label={`Перейти к ${item.name}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div
            className={`
              p-4 border-t border-gray-200 bg-gray-50
              transition-all duration-300
              ${!isClosing ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-2'}
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                aria-hidden="true"
                onClick={handleSettingsClick}
                title="Настройки профиля"
              >
                <span className="text-lg font-semibold text-purple-700">{getUserInitials()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="font-medium text-gray-900 text-sm truncate"
                      title={getDisplayName()}
                    >
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={getDisplayRole()}>
                      {getDisplayRole()}
                    </p>
                  </div>
                  <button
                    onClick={handleSettingsClick}
                    className="ml-2 p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    aria-label="Настройки профиля"
                    title="Настройки"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
