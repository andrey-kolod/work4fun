// src/lib/api/projects.ts

import { fetchJson } from '@/lib/api-client';

export interface ProjectFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectCreateData {
  name: string;
  description?: string | null;
}

export interface ProjectUpdateData {
  name: string;
  description?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface ProjectBasic {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED';
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    tasks: number;
    members: number;
  };
}

export interface ProjectsResponse {
  projects: ProjectBasic[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ProjectsAPI {
  private baseURL = '/api/projects';

  // Получение списка проектов
  async getProjects(filters: ProjectFilters = {}): Promise<ProjectsResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const url = `${this.baseURL}?${params.toString()}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] GET список проектов: ${url}`);
    }

    const { data, error, status } = await fetchJson<ProjectsResponse>(url);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка получения проектов (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось загрузить проекты');
    }

    return data!;
  }

  // Получение одного проекта
  async getProject(id: string): Promise<{ project: ProjectBasic }> {
    const url = `${this.baseURL}/${id}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] GET проект: ${url}`);
    }

    const { data, error, status } = await fetchJson<{ project: ProjectBasic }>(url);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка получения проекта ${id} (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось загрузить проект');
    }

    return data!;
  }

  // Создание проекта
  async createProject(projectData: ProjectCreateData): Promise<{ project: ProjectBasic }> {
    const url = this.baseURL;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] POST создание проекта:`, projectData);
    }

    const { data, error, status } = await fetchJson<{ project: ProjectBasic }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка создания проекта (status ${status}):`, error);
      }

      const message =
        status === 403 ? 'Достигнут лимит в 3 проекта' : error || 'Не удалось создать проект';

      throw new Error(message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [ProjectsAPI] Проект успешно создан:', data?.project);
    }

    return data!;
  }

  // Обновление проекта
  async updateProject(
    id: string,
    projectData: ProjectUpdateData
  ): Promise<{ project: ProjectBasic }> {
    const url = `${this.baseURL}/${id}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] PUT обновление проекта ${id}:`, projectData);
    }

    const { data, error, status } = await fetchJson<{ project: ProjectBasic }>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка обновления проекта (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось обновить проект');
    }

    return data!;
  }

  // Удаление проекта
  async deleteProject(id: string): Promise<{ message: string }> {
    const url = `${this.baseURL}/${id}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] DELETE проект ${id}`);
    }

    const { data, error, status } = await fetchJson<{ message: string }>(url, {
      method: 'DELETE',
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка удаления проекта (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось удалить проект');
    }

    return data!;
  }

  // Добавление пользователя в проект
  async addUserToProject(projectId: string, userId: string): Promise<{ userProject: any }> {
    const url = `${this.baseURL}/${projectId}/users`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] POST добавление пользователя ${userId} в проект ${projectId}`);
    }

    const { data, error, status } = await fetchJson<{ userProject: any }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка добавления пользователя (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось добавить пользователя в проект');
    }

    return data!;
  }

  // Удаление пользователя из проекта
  async removeUserFromProject(projectId: string, userId: string): Promise<{ message: string }> {
    const url = `${this.baseURL}/${projectId}/users/${userId}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ProjectsAPI] DELETE пользователь ${userId} из проекта ${projectId}`);
    }

    const { data, error, status } = await fetchJson<{ message: string }>(url, {
      method: 'DELETE',
    });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ProjectsAPI] Ошибка удаления пользователя (status ${status}):`, error);
      }
      throw new Error(error || 'Не удалось удалить пользователя из проекта');
    }

    return data!;
  }
}

export const projectsAPI = new ProjectsAPI();
