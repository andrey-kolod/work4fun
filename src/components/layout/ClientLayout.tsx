// src/components/layout/ClientLayout.tsx

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

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showHeader && <Header />}
      {showSidebar && <Sidebar />}
      {loading && <PageLoader />}
      <main className={`${showSidebar ? 'lg:pl-64' : ''}`}>
        <ToastProvider>{children}</ToastProvider>
      </main>
    </>
  );
}
