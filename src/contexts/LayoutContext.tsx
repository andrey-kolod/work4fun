// src/contexts/LayoutContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutContextType {
  shouldShowSidebar: boolean;
  shouldShowHeader: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hideHeaderPaths = ['/', '/login', '/register', '/password/reset'];
  const shouldShowHeader = !hideHeaderPaths.includes(pathname);

  const noSidebarPaths = ['/projects', '/project-select'];
  const shouldShowSidebar = shouldShowHeader && !noSidebarPaths.includes(pathname);

  return (
    <LayoutContext.Provider value={{ shouldShowSidebar, shouldShowHeader }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}
