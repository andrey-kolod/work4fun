// src/lib/api/users.ts

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

export interface UserUpdateData {
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatusHistory {
  id: number;
  userId: number;
  oldStatus: boolean;
  newStatus: boolean;
  changedBy: number;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

class UsersAPI {
  private baseURL = '/api/users';

  //    * Получить список пользователей с фильтрацией и пагинацией
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`${this.baseURL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении пользователей');
    }

    return response.json();
  }

  //    * Получить пользователя по ID
  async getUser(id: number): Promise<{ user: User }> {
    const response = await fetch(`${this.baseURL}/${id}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении пользователя');
    }

    return response.json();
  }

  //    * Создать нового пользователя
  async createUser(userData: UserCreateData): Promise<{ user: User }> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при создании пользователя');
    }

    return response.json();
  }

  //    * Обновить пользователя
  async updateUser(id: number, userData: UserUpdateData): Promise<{ user: User }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при обновлении пользователя');
    }

    return response.json();
  }

  //    * Удалить пользователя (мягкое удаление)
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при удалении пользователя');
    }

    return response.json();
  }

  //    * Активировать пользователя
  async activateUser(id: number, reason?: string): Promise<{ user: User; message: string }> {
    const response = await fetch(`${this.baseURL}/${id}/activate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: true, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при активации пользователя');
    }

    return response.json();
  }

  //    * Деактивировать пользователя
  async deactivateUser(id: number, reason?: string): Promise<{ user: User; message: string }> {
    const response = await fetch(`${this.baseURL}/${id}/activate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при деактивации пользователя');
    }

    return response.json();
  }

  //    * Получить историю статусов пользователя
  async getUserHistory(userId: number): Promise<{ history: UserStatusHistory[] }> {
    const response = await fetch(`${this.baseURL}/${userId}/history`);

    if (!response.ok) {
      throw new Error('Ошибка при получении истории пользователя');
    }

    return response.json();
  }
}

export const usersAPI = new UsersAPI();
