// src/app/admin/projects/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export default function CreateProjectPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminId, setAdminId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Загружаем список пользователей для выбора админа
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users?role=ADMIN,SUPER_ADMIN&status=active');
        if (!res.ok) {
          throw new Error(`Ошибка ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        // Фильтруем только активных пользователей
        const activeUsers = data.users?.filter((user: User) => user.isActive) || [];

        if (activeUsers.length === 0) {
          setError('Нет активных пользователей с ролью Администратор');
        }

        setUsers(activeUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Ошибка загрузки списка пользователей');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminId) {
      alert('Пожалуйста, выберите администратора проекта');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          ownerId: adminId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/tasks?projectId=${data.project.id}`);
      } else {
        setError(data.error || 'Ошибка создания проекта');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ошибка создания проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Создание нового проекта</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Название проекта *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            placeholder="Введите название проекта"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Опишите проект"
          />
        </div>

        {/* Поле для выбора администратора */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Администратор проекта *
            <span className="text-gray-500 text-sm ml-2">
              (будет руководить проектом и назначать участников)
            </span>
          </label>

          {usersLoading ? (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="text-gray-500">Загрузка пользователей...</span>
            </div>
          ) : (
            <select
              value={adminId || ''}
              onChange={(e) => setAdminId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={users.length === 0}
            >
              <option value="">
                {users.length === 0 ? 'Нет доступных администраторов' : 'Выберите администратора'}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) -{' '}
                  {user.role === 'SUPER_ADMIN' ? 'Супер-админ' : 'Админ'}
                </option>
              ))}
            </select>
          )}

          {!usersLoading && users.length === 0 && (
            <div className="mt-2 text-sm text-amber-600">
              Нет активных пользователей с ролью Администратор. Сначала создайте пользователя с
              ролью ADMIN или SUPER_ADMIN.
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !adminId || users.length === 0}
            className={`px-6 py-2 rounded-md font-medium ${
              loading || !adminId || users.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading ? 'Создание...' : 'Создать проект'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
