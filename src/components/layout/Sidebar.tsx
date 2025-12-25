// src/components/layout/Sidebar.tsx

// src/components/layout/Sidebar.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();
  const { shouldShowSidebar } = useLayout();

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Выносим useCallback ВНЕ условий
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Управляем анимациями
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
      }, 400);
    };

    if (shouldShowSidebar && sidebarOpen) {
      // Открываем - используем setTimeout для асинхронности
      timer = setTimeout(handleOpen, 0);
    } else if (isVisible) {
      // Закрываем - сначала контент, потом фон
      handleClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sidebarOpen, shouldShowSidebar, isVisible]);

  // Если сайдбар не должен показываться
  if (!shouldShowSidebar || !isVisible) {
    return null;
  }

  const userRole = session?.user ? (session.user as any).role : null;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', visible: true },
    {
      name: 'Задачи',
      href: selectedProject ? `/tasks?projectId=${selectedProject.id}` : '/tasks',
      icon: '✅',
      visible: true,
    },
    { name: 'Проекты', href: '/projects', icon: '📁', visible: true },
    { name: 'Группы', href: '/admin/groups', icon: '👥', visible: isAdmin },
    { name: 'Пользователи', href: '/admin/users', icon: '👤', visible: isAdmin },
    { name: 'Админ панель', href: '/admin', icon: '⚙️', visible: isAdmin },
  ];

  return (
    <>
      {/* Overlay фон - закрывается последним */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 lg:bg-transparent
          transition-all duration-500 ease-in-out
          ${!isClosing ? 'opacity-100' : 'opacity-0'}
          ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        onClick={handleCloseSidebar}
        aria-hidden="true"
      />

      {/* Сам сайдбар - закрывается первым */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 
          bg-white border-r border-gray-200 shadow-lg
          transform transition-all duration-400 ease-in-out
          ${!isClosing ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Боковая панель навигации"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          {/* Заголовок с небольшой задержкой при открытии */}
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

          {/* Навигация */}
          <nav className="flex-1 p-4 space-y-2" aria-label="Основная навигация">
            {navItems
              .filter((item) => item.visible)
              .map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                    pathname.startsWith(item.href.split('?')[0])
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-100',
                    // Анимация появления элементов с задержкой
                    !isClosing
                      ? `opacity-100 translate-x-0 delay-${150 + index * 50}`
                      : 'opacity-0 -translate-x-4'
                  )}
                  onClick={handleCloseSidebar}
                  aria-label={`Перейти к ${item.name}`}
                  aria-current={pathname.startsWith(item.href.split('?')[0]) ? 'page' : undefined}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
          </nav>

          {/* Пользователь */}
          <div
            className={`
              p-4 border-t border-gray-200
              transition-all duration-300
              ${!isClosing ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-2'}
            `}
          >
            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-medium">
                    {(() => {
                      const user = session.user as any;
                      return user.firstName?.[0] || user.email?.[0] || 'U';
                    })()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {(() => {
                      const user = session.user as any;
                      return user.firstName || user.email || 'Пользователь';
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole?.toLowerCase().replace('_', ' ') || 'user'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Гость</p>
                  <p className="text-xs text-gray-500">guest</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
