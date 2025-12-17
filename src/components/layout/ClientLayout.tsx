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

  // Монтирование (как и было)
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Лоадер при смене маршрута (как и было)
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

  const hideHeaderPaths = ['/', '/login', '/register'];
  const showHeader = !hideHeaderPaths.includes(pathname);
  const showSidebar = showHeader;

  // Обработчик клика вне сайдбара
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!sidebarOpen) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // ищем ближайший родитель с нашим классом-обёрткой сайдбара
      const sidebarElement = target.closest('.app-sidebar-root');
      if (!sidebarElement) {
        setSidebarOpen(false);
      }
    },
    [sidebarOpen, setSidebarOpen]
  );

  // Подписка на клики по документу
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showHeader && <Header />}
      {showSidebar && (
        <div className="app-sidebar-root">
          <Sidebar />
        </div>
      )}
      {loading && <PageLoader />}
      <main className={`${showSidebar ? 'lg:pl-64' : ''}`}>
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
