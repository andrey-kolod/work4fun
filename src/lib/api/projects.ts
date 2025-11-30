// src/lib/api/projects.ts

export interface ProjectFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectCreateData {
  name: string;
  description: string;
}

export interface ProjectUpdateData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface ProjectWithDetails {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  progress: number;
  groups: any[];
  users: any[];
  stats: {
    totalTasks: number;
    totalUsers: number;
    totalGroups: number;
    completedTasks: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectsResponse {
  projects: ProjectWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ProjectsAPI {
  private baseURL = '/api/projects';

  async getProjects(filters: ProjectFilters = {}): Promise<ProjectsResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`${this.baseURL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении проектов');
    }

    return response.json();
  }

  async getProject(id: number): Promise<{ project: ProjectWithDetails }> {
    const response = await fetch(`${this.baseURL}/${id}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении проекта');
    }

    return response.json();
  }

  async createProject(projectData: ProjectCreateData): Promise<{ project: any }> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при создании проекта');
    }

    return response.json();
  }

  async updateProject(id: number, projectData: ProjectUpdateData): Promise<{ project: any }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при обновлении проекта');
    }

    return response.json();
  }

  async deleteProject(id: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при удалении проекта');
    }

    return response.json();
  }

  async addUserToProject(projectId: number, userId: number): Promise<{ userProject: any }> {
    const response = await fetch(`${this.baseURL}/${projectId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при добавлении пользователя в проект');
    }

    return response.json();
  }

  async removeUserFromProject(projectId: number, userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/${projectId}/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при удалении пользователя из проекта');
    }

    return response.json();
  }
}

export const projectsAPI = new ProjectsAPI();
