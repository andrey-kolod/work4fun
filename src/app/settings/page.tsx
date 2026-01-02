// src/app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface CustomSessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as CustomSessionUser | undefined;

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Реализовать сохранение данных
    // Пример будущего кода:
    // const { error } = await fetchJson('/api/user/preferences', {
    //   method: 'PATCH',
    //   body: JSON.stringify({ firstName, lastName }),
    // });
    // if (error) { toast.error('Ошибка сохранения'); } else { toast.success('Сохранено!'); }
    setTimeout(() => {
      setIsLoading(false);
      alert('Настройки сохранены!');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>

      <div className="space-y-6">
        {/* Основная информация */}
        <section className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">👤 Основная информация</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Введите вашу фамилию"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full p-2 border rounded bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
          </div>
        </section>

        {/* Роль пользователя (только для просмотра) */}
        <section className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🔐 Учетная запись</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Роль:</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {user?.role === 'SUPER_ADMIN'
                  ? 'Супер-админ'
                  : user?.role === 'ADMIN'
                    ? 'Администратор'
                    : 'Пользователь'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">ID пользователя:</span>
              <span className="text-sm text-gray-600 font-mono">{user?.id}</span>
            </div>
          </div>
        </section>

        {/* Кнопки действий */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Отмена
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>

        {/* Для админов (можно добавить позже) */}
        {user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? (
          <section className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-700">⚙️ Администрирование</h2>
            <p className="text-red-600 mb-4">
              Эти функции появятся позже, когда понадобится админ-панель
            </p>
            <button
              disabled
              className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 opacity-50 cursor-not-allowed"
            >
              Управление пользователями (скоро)
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
