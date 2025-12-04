// src/app/admin/users/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  // ДОБАВИЛИ проверку на undefined
  userGroups?: {
    group: {
      id: number;
      name: string;
    };
  }[];
}

interface Group {
  id: number;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Фильтры
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    group: '',
  });

  // Пагинация
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  // Функция для получения списка пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.group) params.append('group', filters.group);
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Ошибка при получении пользователей');
      }

      const data = await response.json();
      // ДОБАВИЛИ дефолтное значение для userGroups
      const usersWithDefaultGroups = (data.users || []).map((user: any) => ({
        ...user,
        userGroups: user.userGroups || [], // Если userGroups нет, используем пустой массив
      }));
      setUsers(usersWithDefaultGroups);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения списка групп
  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch('/api/groups?page=1&pageSize=100');

      if (!response.ok) {
        throw new Error('Ошибка при получении групп');
      }

      const data = await response.json();
      setAllGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Загружаем пользователей и группы при монтировании компонента
  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [filters, pagination.page]);

  // Обработчики фильтров
  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setFilters((prev) => ({ ...prev, role }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGroupFilter = (group: string) => {
    setFilters((prev) => ({ ...prev, group }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      group: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Проверка активных фильтров
  const hasActiveFilters = filters.search || filters.role || filters.status || filters.group;

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Функция для получения текста роли
  const getRoleText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Супер-админ';
      case 'ADMIN':
        return 'Админ';
      default:
        return 'Пользователь';
    }
  };

  // Функция для получения цвета статуса
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Функция для получения цвета роли
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Получение групп пользователя - ИСПРАВЛЕНА ОШИБКА
  const getUserGroups = (user: User) => {
    // ЗАЩИТА ОТ undefined
    if (!user.userGroups || !Array.isArray(user.userGroups)) {
      return '—';
    }

    const groupNames = user.userGroups.map((ug) => ug.group.name);
    return groupNames.length > 0 ? groupNames.join(', ') : '—';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок и кнопка создания */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
              <p className="mt-2 text-sm text-gray-600">Управление пользователями системы</p>
            </div>
            <button
              onClick={() => router.push('/admin/users/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Создать пользователя
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Поиск */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Поиск по email, имени, фамилии..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Фильтр по роли */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Роль
              </label>
              <select
                id="role"
                value={filters.role}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все роли</option>
                <option value="SUPER_ADMIN">Супер-админ</option>
                <option value="ADMIN">Админ</option>
                <option value="USER">Пользователь</option>
              </select>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все статусы</option>
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
              </select>
            </div>

            {/* Фильтр по группе */}
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                Группа
              </label>
              <select
                id="group"
                value={filters.group}
                onChange={(e) => handleGroupFilter(e.target.value)}
                disabled={groupsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Все группы</option>
                {allGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Кнопка сброса фильтров */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Таблица пользователей */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            // Загрузка
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка пользователей...</p>
            </div>
          ) : users.length === 0 ? (
            // Нет пользователей
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {hasActiveFilters ? 'Пользователи не найдены' : 'Нет пользователей'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters
                  ? 'Попробуйте изменить параметры фильтрации'
                  : 'Начните с создания первого пользователя.'}
              </p>
              {hasActiveFilters && (
                <div className="mt-6">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Список пользователей
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группы
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                        >
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}
                        >
                          {user.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs">{getUserGroups(user)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => console.log('Edit user:', user.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => console.log('Delete user:', user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {users.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Показано{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  из <span className="font-medium">{pagination.total}</span> пользователей
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
