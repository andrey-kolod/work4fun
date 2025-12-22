// src/components/layout/ClientLayout.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
      setPrevPathname(pathname);
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const isNewPath = mounted && pathname !== prevPathname;

  useEffect(() => {
    if (!isNewPath) return;

    const showTimer = setTimeout(() => {
      setShowLoader(true);

      const hideTimer = setTimeout(() => {
        setShowLoader(false);
        setPrevPathname(pathname);
      }, 400);

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
  }, [pathname, mounted]);

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

  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      sidebarRef.current.focus();
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [ClientLayout] Sidebar открыт — фокус установлен');
      }
    }
  }, [sidebarOpen]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showHeader && <Header />}

      {showSidebar && (
        <div
          className="app-sidebar-root fixed lg:static lg:translate-x-0 z-40"
          aria-hidden={!sidebarOpen}
          role="complementary"
          ref={sidebarRef}
          tabIndex={-1}
        >
          <Sidebar />
        </div>
      )}

      {showLoader && <PageLoader aria-live="polite" aria-label="Загрузка страницы" />}

      <main
        className={`
          min-h-screen
          transition-all duration-300 ease-in-out
          ${showSidebar ? 'lg:pl-64' : 'lg:pl-0'}
        `}
        role="main"
        aria-label="Основное содержимое"
      >
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
