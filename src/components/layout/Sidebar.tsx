'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Дашборд', href: '/dashboard', icon: '📊' },
  { name: 'Проекты', href: '/projects', icon: '📁' },
  { name: 'Задачи', href: '/tasks', icon: '✅' },
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Группы', href: '/admin/groups', icon: '🏢' },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-purple-700 transform transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      ></div>
      <div className="flex items-center justify-center h-16 bg-purple-800">
        <span className="text-white text-xl font-bold">Work4Fun</span>
      </div>
      <nav className="mt-8">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center px-6 py-3 text-purple-100 hover:bg-purple-600 transition-colors',
              pathname === item.href && 'bg-purple-600 border-r-4 border-white'
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
