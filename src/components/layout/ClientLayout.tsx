// src/components/layout/ClientLayout.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PageLoader from '@/components/ui/PageLoader';
import { useAppStore } from '@/store/useAppStore';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const { sidebarOpen } = useAppStore();
  const { shouldShowSidebar, shouldShowHeader } = useLayout();

  const handleMount = useCallback(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(handleMount);
    return () => cancelAnimationFrame(animationFrameId);
  }, [handleMount]);

  useEffect(() => {
    if (!mounted) return;

    const showTimer = setTimeout(() => {
      setShowLoader(true);
    }, 0);

    const hideTimer = setTimeout(() => {
      setShowLoader(false);
    }, 300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [mounted]);

  // Блокируем скролл ТОЛЬКО на мобильных
  useEffect(() => {
    if (!shouldShowSidebar) return;

    const isMobile = window.innerWidth < 1024; // lg breakpoint

    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, shouldShowSidebar]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {shouldShowHeader && <Header />}
      {shouldShowSidebar && <Sidebar />}
      {showLoader && <PageLoader aria-live="polite" aria-label="Загрузка страницы" />}

      <main className="min-h-screen" role="main" aria-label="Основное содержимое">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
