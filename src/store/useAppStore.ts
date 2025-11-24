// Импортируем функцию create из Zustand
import { create } from 'zustand';

// === ВРЕМЕННЫЕ ИНТЕРФЕЙСЫ (потом заменим на настоящие из Prisma) ===

// Временный интерфейс пользователя
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Временный интерфейс проекта
interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Временный интерфейс задачи
interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Временный интерфейс группы
interface Group {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Временный интерфейс уведомления
interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

// === ИНТЕРФЕЙС СОСТОЯНИЯ (STATE) ===

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  projects: Project[];
  groups: Group[];
  tasks: Task[];
  notifications: Notification[];
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'projects' | 'tasks' | 'users' | 'groups';
  loading: {
    users: boolean;
    projects: boolean;
    tasks: boolean;
  };
}

// === ИНТЕРФЕЙС ДЕЙСТВИЙ (ACTIONS) ===

interface AppActions {
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  setUsers: (users: User[]) => void;
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  addUser: (user: User) => void;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

// === СОЗДАЕМ STORE ===

// Типизируем set и get функции
export const useAppStore = create<AppState & AppActions>(
  (
    set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
    get: () => AppState & AppActions
  ) => ({
    // ======================
    // НАЧАЛЬНОЕ СОСТОЯНИЕ
    // ======================

    currentUser: null,
    isAuthenticated: false,
    users: [],
    projects: [],
    groups: [],
    tasks: [],
    notifications: [],
    sidebarOpen: false,
    currentView: 'dashboard',
    loading: {
      users: false,
      projects: false,
      tasks: false,
    },

    // ======================
    // ДЕЙСТВИЯ (ACTIONS)
    // ======================

    // setCurrentUser - устанавливает текущего пользователя
    setCurrentUser: (user: User | null): void => {
      set({
        currentUser: user,
        isAuthenticated: !!user,
      });
    },

    // logout - выход пользователя
    logout: (): void => {
      set({
        currentUser: null,
        isAuthenticated: false,
        users: [],
        projects: [],
        tasks: [],
      });
    },

    // setUsers - заменяет весь массив пользователей
    setUsers: (users: User[]): void => {
      set({ users });
    },

    // setProjects - заменяет весь массив проектов
    setProjects: (projects: Project[]): void => {
      set({ projects });
    },

    // setTasks - заменяет весь массив задач
    setTasks: (tasks: Task[]): void => {
      set({ tasks });
    },

    // setSidebarOpen - управление боковой панелью
    setSidebarOpen: (open: boolean): void => {
      set({ sidebarOpen: open });
    },

    // setCurrentView - смена активной страницы
    setCurrentView: (view: AppState['currentView']): void => {
      set({ currentView: view });
    },

    // addUser - добавление нового пользователя
    addUser: (user: User): void => {
      set((state: AppState) => ({
        users: [...state.users, user],
      }));
    },

    // updateUser - обновление пользователя
    updateUser: (id: number, userData: Partial<User>): void => {
      set((state: AppState) => ({
        users: state.users.map((user: User) => (user.id === id ? { ...user, ...userData } : user)),
      }));
    },

    // deleteUser - удаление пользователя
    deleteUser: (id: number): void => {
      set((state: AppState) => ({
        users: state.users.filter((user: User) => user.id !== id),
      }));
    },
  })
);
