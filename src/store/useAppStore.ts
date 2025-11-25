// /src/store/useAppStore.ts

import { create } from 'zustand';
import { User, Project, Task, Group, Notification } from '@/types/user';

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

export const useAppStore = create<AppState & AppActions>((set, get) => ({
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
      users: [],
      projects: [],
      tasks: [],
    });
  },

  setUsers: (users: User[]) => {
    set({ users });
  },

  setProjects: (projects: Project[]) => {
    set({ projects });
  },

  setTasks: (tasks: Task[]) => {
    set({ tasks });
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
}));
