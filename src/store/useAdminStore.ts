// src/store/useAdminStore.ts

import { create } from 'zustand';
import { User, Group, Project } from '@prisma/client';

interface FiltersState {
  users: {
    search: string;
    role: ('SUPER_ADMIN' | 'ADMIN' | 'USER')[];
    status: ('active' | 'inactive')[];
    group: number[];
  };
  groups: {
    search: string;
    status: ('active' | 'inactive')[];
    hasManager: boolean;
  };
  projects: {
    search: string;
    status: ('ACTIVE' | 'COMPLETED' | 'ARCHIVED')[];
    group: number[];
  };
}

interface AdminStore {
  // Фильтры и поиск
  filters: FiltersState;
  setFilter: <T extends keyof FiltersState>(entity: T, filter: Partial<FiltersState[T]>) => void;
  resetFilters: (entity?: keyof FiltersState) => void;

  // Массовые операции
  selectedItems: number[];
  setSelectedItems: (ids: number[]) => void;
  clearSelection: () => void;

  // Пагинация
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  setPagination: (pagination: Partial<AdminStore['pagination']>) => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Начальное состояние фильтров
  filters: {
    users: {
      search: '',
      role: [],
      status: [],
      group: [],
    },
    groups: {
      search: '',
      status: [],
      hasManager: false,
    },
    projects: {
      search: '',
      status: [],
      group: [],
    },
  },

  // Действия фильтров
  setFilter: (entity, filter) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [entity]: {
          ...state.filters[entity],
          ...filter,
        },
      },
    })),

  resetFilters: (entity) =>
    set((state) => {
      if (entity) {
        return {
          filters: {
            ...state.filters,
            [entity]: getInitialFilters()[entity],
          },
        };
      }
      return { filters: getInitialFilters() };
    }),

  // Выбранные элементы
  selectedItems: [],
  setSelectedItems: (ids) => set({ selectedItems: ids }),
  clearSelection: () => set({ selectedItems: [] }),

  // Пагинация
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),
}));

function getInitialFilters(): FiltersState {
  return {
    users: {
      search: '',
      role: [],
      status: [],
      group: [],
    },
    groups: {
      search: '',
      status: [],
      hasManager: false,
    },
    projects: {
      search: '',
      status: [],
      group: [],
    },
  };
}
