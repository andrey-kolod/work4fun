'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { UserForm } from '@/components/forms/UserForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserCreateData } from '@/schemas/user';
import { apiService } from '@/services/api';
import { User } from '@/types/user';

export default function UsersPage() {
  const { users, setUsers, addUser } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        alert('Не удалось загрузить пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [setUsers]);

  const handleCreateUser = async (data: UserCreateData) => {
    setLoading(true);
    try {
      const newUser = await apiService.createUser(data);
      addUser(newUser);
      setShowForm(false);

      alert('Пользователь успешно создан!');
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      alert('Не удалось создать пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
        <Button onClick={() => setShowForm(true)} disabled={loading}>
          Создать пользователя
        </Button>
      </div>

      {showForm && (
        <UserForm
          onSubmit={handleCreateUser}
          loading={loading}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка пользователей...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.firstName} {user.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}
