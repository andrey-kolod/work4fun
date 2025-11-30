// src/lib/api/groups.ts

import { Group, User, Project } from '@prisma/client';

export interface GroupFilters {
  search?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}

export interface GroupCreateData {
  name: string;
  description: string;
  projectId: number;
}

export interface GroupUpdateData {
  name: string;
  description: string;
}

export interface GroupsResponse {
  groups: (Group & {
    project: Project;
    users: User[];
    userCount: number;
    taskCount: number;
  })[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class GroupsAPI {
  private baseURL = '/api/groups';

  async getGroups(filters: GroupFilters = {}): Promise<GroupsResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`${this.baseURL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении групп');
    }

    return response.json();
  }

  async getGroup(id: number): Promise<{ group: any }> {
    const response = await fetch(`${this.baseURL}/${id}`);

    if (!response.ok) {
      throw new Error('Ошибка при получении группы');
    }

    return response.json();
  }

  async createGroup(groupData: GroupCreateData): Promise<{ group: Group }> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при создании группы');
    }

    return response.json();
  }

  async updateGroup(id: number, groupData: GroupUpdateData): Promise<{ group: Group }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при обновлении группы');
    }

    return response.json();
  }

  async deleteGroup(id: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при удалении группы');
    }

    return response.json();
  }

  async addUserToGroup(groupId: number, userId: number): Promise<{ userGroup: any }> {
    const response = await fetch(`${this.baseURL}/${groupId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при добавлении пользователя в группу');
    }

    return response.json();
  }

  async removeUserFromGroup(groupId: number, userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/${groupId}/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при удалении пользователя из группы');
    }

    return response.json();
  }
}

export const groupsAPI = new GroupsAPI();
