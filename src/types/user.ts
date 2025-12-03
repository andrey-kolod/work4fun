// src/types/user.ts
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  name?: string;
  groupId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  groupId?: number;
}
