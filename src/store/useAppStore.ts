// src/store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SimpleProject, Task, Group } from '@/types';

interface AppState {
  // Пользователь
  currentUser: User | null;
  isAuthenticated: boolean;

  // Выбранный проект
  selectedProject: SimpleProject | null;

  // Данные
  users: User[];
  projects: SimpleProject[];
  groups: Group[];
  tasks: Task[];

  // UI состояния
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'projects' | 'tasks' | 'users' | 'groups';
  loading: {
    users: boolean;
    projects: boolean;
    tasks: boolean;
  };
}

interface AppActions {
  // Пользователь
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  // Проект
  setSelectedProject: (project: SimpleProject | null) => void;

  // Данные
  setUsers: (users: User[]) => void;
  setProjects: (projects: SimpleProject[]) => void;
  setGroups: (groups: Group[]) => void;
  setTasks: (tasks: Task[]) => void;

  // Работа с задачами
  addTask: (task: Task) => void;
  updateTask: (taskId: number, updates: Partial<Task>) => void;
  deleteTask: (taskId: number) => void;
  refreshTasks: (projectId?: number) => Promise<void>;

  // UI
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: AppState['currentView']) => void;

  // Дополнительные методы
  addUser: (user: User) => void;
  updateUser: (id: number, userData: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentUser: null,
      isAuthenticated: false,
      selectedProject: null,
      users: [],
      projects: [],
      groups: [],
      tasks: [],
      sidebarOpen: false,
      currentView: 'dashboard',
      loading: {
        users: false,
        projects: false,
        tasks: false,
      },

      // Действия
      setCurrentUser: (user: User | null) => {
        set({
          currentUser: user,
          isAuthenticated: !!user,
        });
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          selectedProject: null,
          users: [],
          projects: [],
          tasks: [],
        });
      },

      setSelectedProject: (project: SimpleProject | null) => {
        console.log('[AppStore] Setting selected project:', project);
        set({ selectedProject: project });
      },

      setUsers: (users: User[]) => {
        set({ users });
      },

      setProjects: (projects: SimpleProject[]) => {
        set({ projects });
      },

      setGroups: (groups: Group[]) => {
        set({ groups });
      },

      setTasks: (tasks: Task[]) => {
        set({ tasks });
      },

      // 🔧 ДОБАВЛЕННЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ЗАДАЧАМИ
      addTask: (task: Task) => {
        set((state) => ({
          tasks: [...state.tasks, task],
        }));
      },

      updateTask: (taskId: number, updates: Partial<Task>) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
        }));
      },

      deleteTask: (taskId: number) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
      },

      refreshTasks: async (projectId?: number) => {
        try {
          const currentProjectId = projectId || get().selectedProject?.id;
          if (!currentProjectId) return;

          const response = await fetch(`/api/tasks?projectId=${currentProjectId}`);
          if (response.ok) {
            const data = await response.json();
            set({ tasks: data.tasks || [] });
          }
        } catch (error) {
          console.error('Error refreshing tasks:', error);
        }
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      setCurrentView: (view: AppState['currentView']) => {
        set({ currentView: view });
      },

      addUser: (user: User) => {
        set((state) => ({
          users: [...state.users, user],
        }));
      },

      updateUser: (id: number, userData: Partial<User>) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...userData } : user)),
        }));
      },

      deleteUser: (id: number) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        selectedProject: state.selectedProject,
        currentView: state.currentView,
      }),
    }
  )
);
