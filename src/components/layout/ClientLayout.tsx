'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PageLoader from '@/components/ui/PageLoader';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathRef = useRef(pathname);
  const [mounted, setMounted] = useState(false);

  // Используем useEffect для асинхронной установки mounted
  useEffect(() => {
    // Используем requestAnimationFrame для асинхронного обновления состояния
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    // Показываем загрузчик при смене маршрута
    if (pathname !== prevPathRef.current && mounted) {
      // Используем setTimeout для асинхронного обновления состояния
      const timer = setTimeout(() => {
        setLoading(true);

        // Убираем лоадер через 300мс
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

  // 🔧 Определяем страницы без хедера
  const hideHeaderPaths = ['/', '/login', '/register'];
  const showHeader = !hideHeaderPaths.includes(pathname);
  const showSidebar = showHeader; // Сайдбар показываем там же где и хедер

  // 🔧 Определяем дополнительные отступы для разных страниц
  const getTopPadding = () => {
    if (pathname === '/') return 'pt-12 md:pt-20'; // Больший отступ для главной
    if (pathname === '/login' || pathname === '/register') return 'pt-10 md:pt-16'; // Средний отступ для логина/регистрации
    return 'pt-6'; // Обычный отступ для остальных страниц
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showHeader && <Header />}
      {showSidebar && <Sidebar />}
      {loading && <PageLoader />}
      <main className={`min-h-screen ${showSidebar ? 'lg:pl-64' : ''} ${getTopPadding()}`}>
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
