'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PageLoader from '@/components/ui/PageLoader';
import { useAppStore } from '@/store/useAppStore';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [prevPathname, setPrevPathname] = useState('');

  const { sidebarOpen, setSidebarOpen } = useAppStore();

  // ✅ 1. Монтирование + инициализация
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
      setPrevPathname(pathname);
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // ✅ 2. Derived state (чистый, без эффектов)
  const isNewPath = mounted && pathname !== prevPathname;

  // ✅ 3. Loader логика (ВСЕ setState в timeout callbacks)
  useEffect(() => {
    if (!isNewPath) return;

    // Показываем loader через setTimeout (0ms = следующий тик)
    const showTimer = setTimeout(() => {
      setShowLoader(true);

      // 400ms минимум + document check
      const hideTimer = setTimeout(() => {
        setShowLoader(false);
        setPrevPathname(pathname); // ✅ Обновляем prevPathname
      }, 400);

      // Проверка document.readyState
      const checkLoad = () => {
        if (document.readyState === 'complete') {
          clearTimeout(hideTimer);
          setShowLoader(false);
          setPrevPathname(pathname);
        }
      };

      const intervalId = setInterval(checkLoad, 50);

      return () => {
        clearTimeout(hideTimer);
        clearInterval(intervalId);
      };
    }, 0);

    return () => clearTimeout(showTimer);
  }, [pathname, mounted]); // ✅ Только стабильные зависимости

  const hideHeaderPaths = ['/', '/login', '/register', '/password/reset'];
  const noSidebarPaths = ['/projects'];

  const showHeader = !hideHeaderPaths.includes(pathname);
  const showSidebar = showHeader && !noSidebarPaths.includes(pathname);

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
      {showHeader && <Header />}
      {showSidebar && (
        <div className="app-sidebar-root fixed lg:static lg:translate-x-0 z-40">
          <Sidebar />
        </div>
      )}
      {showLoader && <PageLoader />}
      <main
        className={`
          min-h-screen
          transition-all duration-300 ease-in-out
          ${showSidebar ? 'lg:pl-64' : 'lg:pl-0'}
        `}
      >
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
