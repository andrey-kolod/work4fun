// src/components/modals/CreateTaskModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { TaskFormData } from '@/types/task';

interface CreateTaskModalProps {
  onClose: () => void;
  onSuccess?: (newTask?: any) => void;
  projectId: number;
}

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  isActive: boolean;
  role?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  onSuccess,
  projectId,
}) => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    projectId: projectId,
    assigneeIds: [],
  });

  // Загружаем пользователей проекта
  useEffect(() => {
    const loadUsers = async () => {
      if (!projectId) return;

      setLoadingUsers(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/users`);

        if (!response.ok) {
          throw new Error('Не удалось загрузить пользователей проекта');
        }

        const data = await response.json();

        // Обрабатываем пользователей проекта
        const projectUsers = (data.users || [])
          .map((item: any) => {
            const user = item.user || item;
            return {
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email,
              isActive: user.isActive,
              role: user.role,
            };
          })
          .filter((user: User) => user.isActive);

        console.log('Загружены пользователи проекта:', projectUsers);
        setUsers(projectUsers);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        addToast({
          type: 'error',
          title: 'Ошибка',
          description: 'Не удалось загрузить список пользователей проекта',
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [projectId, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Введите название задачи');
      }
      if (!projectId) {
        throw new Error('Проект не выбран');
      }

      // Добавляем выбранных пользователей в данные
      const dataToSend = {
        title: formData.title.trim(),
        description: formData.description || '',
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        projectId: projectId,
        assigneeIds: selectedUsers,
      };

      console.log('Отправка данных задачи:', dataToSend);

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      console.log('Ответ от сервера при создании задачи:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать задачу');
      }

      addToast({
        type: 'success',
        title: 'Успех!',
        description: 'Задача успешно создана',
      });

      if (onSuccess) {
        onSuccess(result.task);
      }

      onClose();
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      addToast({
        type: 'error',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email;
  };

  const getRoleDisplayName = (role?: string) => {
    if (!role) return '';
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Супер-админ';
      case 'ADMIN':
        return 'Админ';
      case 'USER':
        return 'Пользователь';
      default:
        return role;
    }
  };

  // Временная функция для отладки
  const debugUsers = async () => {
    try {
      console.log('=== DEBUG: Проверка пользователей ===');
      console.log('Текущий проект ID:', projectId);

      // Проверим API напрямую
      const response = await fetch(`/api/projects/${projectId}/users`);
      const data = await response.json();
      console.log('Ответ API /api/projects/[id]/users:', data);
    } catch (error) {
      console.error('DEBUG ошибка:', error);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Создание новой задачи" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-end gap-2 mb-2">
          <button
            type="button"
            onClick={debugUsers}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            (debug users)
          </button>
        </div>

        <Input
          label="Название задачи *"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          placeholder="Введите название задачи"
          disabled={isLoading}
        />

        <Textarea
          label="Описание"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Опишите задачу подробнее"
          rows={4}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Приоритет"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            options={[
              { value: 'LOW', label: 'Низкий' },
              { value: 'MEDIUM', label: 'Средний' },
              { value: 'HIGH', label: 'Высокий' },
              { value: 'URGENT', label: 'Срочно' },
            ]}
            disabled={isLoading}
          />

          <Select
            label="Статус"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'REVIEW', label: 'Review' },
              { value: 'DONE', label: 'Done' },
            ]}
            disabled={isLoading}
          />
        </div>

        <Input
          label="Дедлайн"
          type="date"
          value={formData.dueDate || ''}
          onChange={(e) => handleChange('dueDate', e.target.value)}
          disabled={isLoading}
        />

        {/* Поле для выбора исполнителей */}
        <div>
          <label className="block text-sm font-medium mb-2">Исполнители (опционально)</label>
          {loadingUsers ? (
            <div className="p-4 text-center border border-gray-200 rounded-md">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Загрузка пользователей...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-3 text-center border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm text-gray-500">Нет доступных пользователей в проекте</p>
              <p className="text-xs text-gray-400 mt-1">Можете создать задачу без исполнителей</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-2">
                Доступно пользователей: {users.length}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {users.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isLoading && toggleUserSelection(user.id)}
                    >
                      <div
                        className={`h-4 w-4 rounded border mr-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="h-2 w-2 bg-white rounded-sm" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        {user.role && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {getRoleDisplayName(user.role)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Показать выбранных пользователей */}
              {selectedUsers.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">
                    Выбрано: {selectedUsers.length}{' '}
                    {selectedUsers.length === 1 ? 'исполнитель' : 'исполнителя'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {users
                      .filter((user) => selectedUsers.includes(user.id))
                      .map((user) => (
                        <div
                          key={user.id}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {getUserDisplayName(user)}
                          <button
                            type="button"
                            onClick={() => !isLoading && toggleUserSelection(user.id)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Задача будет создана в проекте ID: <span className="font-semibold">{projectId}</span>
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isLoading ? 'Создание...' : 'Создать задачу'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
