// path: src/components/layout/ClientLayout.tsx
// Этот файл — клиентская обёртка для всего приложения.
// Он отвечает за:
// - Показ хедера
// - Показ и управление сайдбаром
// - Отступ контента под сайдбар (только когда он реально нужен)
// - Лоадер при смене страниц
// - Закрытие сайдбара при клике вне его

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PageLoader from '@/components/ui/PageLoader';
import { useAppStore } from '@/store/useAppStore';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathRef = useRef(pathname);
  const [mounted, setMounted] = useState(false);

  const { sidebarOpen, setSidebarOpen } = useAppStore();

  // Монтирование компонента (для избежания hydration mismatch)
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Лоадер при смене маршрута
  useEffect(() => {
    if (pathname !== prevPathRef.current && mounted) {
      const timer = setTimeout(() => {
        setLoading(true);
        const hideLoaderTimer = setTimeout(() => {
          setLoading(false);
          prevPathRef.current = pathname;
        }, 300);
        return () => clearTimeout(hideLoaderTimer);
      }, 0);
      return () => clearTimeout(timer);
    } else if (mounted) {
      prevPathRef.current = pathname;
    }
  }, [pathname, mounted]);

  // === КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ===
  // Страницы, где НЕТ хедера и сайдбара (публичные)
  const hideHeaderPaths = ['/', '/login', '/register', '/password/reset']; // можно добавить другие

  // Страницы, где хедер ЕСТЬ, но сайдбар ЕЩЁ НЕ НУЖЕН (промежуточные)
  const noSidebarPaths = ['/projects', '/project-select']; // сюда добавляем выбор проекта

  const showHeader = !hideHeaderPaths.includes(pathname);

  // Сайдбар показываем только если хедер есть И мы НЕ на странице без сайдбара
  const showSidebar = showHeader && !noSidebarPaths.includes(pathname);

  // Обработчик клика вне сайдбара (только если сайдбар открыт)
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!sidebarOpen) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const sidebarElement = target.closest('.app-sidebar-root');
      if (!sidebarElement) {
        setSidebarOpen(false);
      }
    },
    [sidebarOpen, setSidebarOpen]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Хедер показываем на всех авторизованных страницах */}
      {showHeader && <Header />}

      {/* Сайдбар показываем только в рабочей зоне приложения */}
      {showSidebar && (
        <div className="app-sidebar-root">
          <Sidebar />
        </div>
      )}

      {/* Лоадер при навигации */}
      {loading && <PageLoader />}

      {/* Основной контент */}
      <main
        className={`
          min-h-screen
          transition-all duration-300
          ${showSidebar ? 'lg:pl-64' : ''}  // Отступ ТОЛЬКО если сайдбар реально показан
        `}
      >
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
