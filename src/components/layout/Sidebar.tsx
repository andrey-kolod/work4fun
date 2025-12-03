// src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { selectedProject, sidebarOpen, setSidebarOpen } = useAppStore();

  // Безопасный доступ к свойствам пользователя
  const userRole = session?.user ? (session.user as any).role : null;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      visible: true,
    },
    {
      name: 'Задачи',
      href: selectedProject ? `/tasks?projectId=${selectedProject.id}` : '/tasks',
      icon: '✅',
      visible: true,
    },
    {
      name: 'Проекты',
      href: '/project-select',
      icon: '📁',
      visible: true,
    },
    {
      name: 'Группы',
      href: '/admin/groups',
      icon: '👥',
      visible: isAdmin,
    },
    {
      name: 'Пользователи',
      href: '/admin/users',
      icon: '👤',
      visible: isAdmin,
    },
    {
      name: 'Админ панель',
      href: '/admin',
      icon: '⚙️',
      visible: isAdmin,
    },
  ];

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Work4Fun</h2>
          <p className="text-sm text-gray-600 mt-1">Управление проектами</p>
        </div>

        {/* Информация о проекте */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          {selectedProject ? (
            <>
              <p className="text-sm text-gray-600 mb-1">Текущий проект:</p>
              <p className="font-medium text-gray-900 truncate">{selectedProject.name}</p>
              {selectedProject.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">{selectedProject.description}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">Проект не выбран</p>
          )}
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  pathname.startsWith(item.href.split('?')[0])
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
        </nav>

        {/* Пользователь */}
        <div className="p-4 border-t border-gray-200">
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
    </div>
  );
};

export default Sidebar;
