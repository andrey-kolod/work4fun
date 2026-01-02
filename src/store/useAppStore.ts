// src/store/useAppStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SimpleProject } from '@/types'; // [ИЗМЕНЕНО] Убрали Task и Group — они не используются

interface AppState {
  // Пользователь (из сессии NextAuth)
  currentUser: User | null;
  isAuthenticated: boolean;

  // Выбранный проект (для навигации по задачам, дашборду и т.д.)
  selectedProject: SimpleProject | null;

  // UI состояния
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'projects' | 'tasks' | 'settings'; // [УЛУЧШЕНО] Оставили только актуальные views
}

interface AppActions {
  // Пользователь
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  // Проект
  setSelectedProject: (project: SimpleProject | null) => void;

  // UI
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: AppState['currentView']) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentUser: null,
      isAuthenticated: false,
      selectedProject: null,
      sidebarOpen: false,
      currentView: 'dashboard',

      // Действия с пользователем
      setCurrentUser: (user: User | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppStore] Установка текущего пользователя:', user?.email || 'null');
        }
        set({
          currentUser: user,
          isAuthenticated: !!user,
        });
      },

      logout: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppStore] Выход из системы — полная очистка стора');
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          selectedProject: null,
          sidebarOpen: false,
          currentView: 'dashboard',
        });
      },

      // Выбор проекта
      setSelectedProject: (project: SimpleProject | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[AppStore] Выбор проекта:',
            project?.name || 'null',
            '(ID:',
            project?.id || 'none',
            ')'
          );
        }
        set({ selectedProject: project });
      },

      // Состояние боковой панели
      setSidebarOpen: (open: boolean) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppStore] Сайдбар:', open ? 'открыт' : 'закрыт');
        }
        set({ sidebarOpen: open });
      },

      // Смена текущего вида (для будущего расширения навигации)
      setCurrentView: (view: AppState['currentView']) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppStore] Смена вида на:', view);
        }
        set({ currentView: view });
      },
    }),
    {
      name: 'app-storage', // Ключ в localStorage
      partialize: (state) => ({
        // Сохраняем между сессиями только выбранный проект и состояние сайдбара
        selectedProject: state.selectedProject,
        sidebarOpen: state.sidebarOpen,
      }),
      // [УЛУЧШЕНИЕ] Версия стора для будущих миграций
      version: 3,
      migrate: (persistedState: any) => {
        // Если в старых данных были tasks/users/projects — просто игнорируем их
        return persistedState;
      },
    }
  )
);
