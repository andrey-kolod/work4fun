// src/services/api.ts

import { User, CreateUserData } from '@/types/user';

class ApiService {
  private getBaseUrl(): string {
    // В Next.js публичные env переменные должны начинаться с NEXT_PUBLIC_
    if (typeof window !== 'undefined') {
      // Клиентская сторона
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    } else {
      // Серверная сторона
      return process.env.API_URL || 'http://localhost:3001/api';
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    console.log('API Request:', url); // Для отладки

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Получить всех пользователей
  async getUsers(): Promise<User[]> {
    // Временная заглушка - в реальном приложении здесь будет реальный API вызов
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            firstName: 'Иван',
            lastName: 'Иванов',
            email: 'ivan@example.com',
            role: 'ADMIN',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
          },
          {
            id: 2,
            firstName: 'Петр',
            lastName: 'Петров',
            email: 'petr@example.com',
            role: 'USER',
            createdAt: new Date('2024-01-16'),
            updatedAt: new Date('2024-01-16'),
          },
        ]);
      }, 500);
    });

    // Реальный вызов будет выглядеть так:
    // return this.request<User[]>('/users');
  }

  // Создать пользователя
  async createUser(userData: CreateUserData): Promise<User> {
    // Временная заглушка
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }, 500);
    });

    // Реальный вызов будет выглядеть так:
    // return this.request<User>('/users', {
    //   method: 'POST',
    //   body: JSON.stringify(userData),
    // });
  }
}

export const apiService = new ApiService();
