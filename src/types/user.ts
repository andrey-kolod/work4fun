// work4fun/src/types/user.ts
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  maxProjects?: number;
  projectCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  groupId?: number;
}

// Дополнительный интерфейс для формы пользователя
export interface UserFormValues {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  scope: 'ALL' | 'SPECIFIC_GROUPS';
  visibleGroups: string[];
  isActive: boolean;
}
