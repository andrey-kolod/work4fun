// src/components/TestStore.tsx
'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// Создаем интерфейсы которые точно соответствуют типам из store
interface TestUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

interface TestProject {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  ownerId: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface TestTask {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: Date;
  projectId: number;
  assignedTo: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Выносим вычисление дат в константы ВНЕ компонента
const THIRTY_DAYS_FROM_NOW = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const SEVEN_DAYS_FROM_NOW = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const NOW = new Date();

const TestStore: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    users,
    projects,
    tasks,
    sidebarOpen,
    currentView,
    setCurrentUser,
    setUsers,
    setProjects,
    setTasks,
    setSidebarOpen,
    setCurrentView,
    addUser,
    updateUser,
    deleteUser,
  } = useAppStore();

  // Тестовые данные
  const testUser: TestUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Тестовый',
    lastName: 'Пользователь',
    role: 'USER',
    createdAt: NOW,
    updatedAt: NOW,
  };

  const testUsers: TestUser[] = [
    testUser,
    {
      id: 2,
      email: 'admin@example.com',
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'ADMIN',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const testProjects: TestProject[] = [
    {
      id: 1,
      name: 'Тестовый проект',
      description: 'Описание тестового проекта',
      status: 'ACTIVE',
      ownerId: 1,
      startDate: NOW,
      endDate: THIRTY_DAYS_FROM_NOW,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    },
  ];

  const testTasks: TestTask[] = [
    {
      id: 1,
      title: 'Тестовая задача',
      description: 'Описание тестовой задачи',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: SEVEN_DAYS_FROM_NOW,
      projectId: 1,
      assignedTo: 1,
      createdBy: 1,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    },
  ];

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '5px' }}>
      <h2>🧪 Тест Store (Zustand)</h2>

      {/* Информация о текущем состоянии */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Текущий пользователь:</strong>{' '}
        {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Не авторизован'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Аутентифицирован:</strong> {isAuthenticated ? 'Да' : 'Нет'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Пользователей в store:</strong> {users.length}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Проектов в store:</strong> {projects.length}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Задач в store:</strong> {tasks.length}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Боковая панель:</strong> {sidebarOpen ? 'Открыта' : 'Закрыта'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Текущий вид:</strong> {currentView}
      </div>

      {/* Кнопки действий */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={() => setCurrentUser(testUser)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Установить пользователя
        </button>

        <button
          onClick={() => setCurrentUser(null)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Сбросить пользователя
        </button>

        <button
          onClick={() => setUsers(testUsers)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#00c851',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Загрузить пользователей
        </button>

        <button
          onClick={() => setProjects(testProjects)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ffbb33',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Загрузить проекты
        </button>

        <button
          onClick={() => setTasks(testTasks)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#aa66cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Загрузить задачи
        </button>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#33b5e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Переключить панель
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#2BBBAD',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Вид: Дашборд
        </button>

        <button
          onClick={() => setCurrentView('projects')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Вид: Проекты
        </button>

        <button
          onClick={() => setCurrentView('users')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FF8800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Вид: Пользователи
        </button>

        <button
          onClick={() =>
            addUser({
              id: Date.now(),
              email: `newuser${Date.now()}@example.com`,
              firstName: 'Новый',
              lastName: 'Пользователь',
              role: 'USER',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
          style={{
            padding: '8px 12px',
            backgroundColor: '#CC0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Добавить пользователя
        </button>

        <button
          onClick={() => {
            if (users.length > 0) {
              updateUser(users[0].id, { firstName: 'Обновленное Имя' });
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9933CC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Обновить первого пользователя
        </button>

        <button
          onClick={() => {
            if (users.length > 0) {
              deleteUser(users[0].id);
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FF4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Удалить первого пользователя
        </button>
      </div>

      {/* Детальная информация */}
      {currentUser && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
          }}
        >
          <h3>Детали текущего пользователя:</h3>
          <pre>{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
      )}

      {users.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
          }}
        >
          <h3>Пользователи ({users.length}):</h3>
          <pre>{JSON.stringify(users, null, 2)}</pre>
        </div>
      )}

      {projects.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
          }}
        >
          <h3>Проекты ({projects.length}):</h3>
          <pre>{JSON.stringify(projects, null, 2)}</pre>
        </div>
      )}

      {tasks.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
          }}
        >
          <h3>Задачи ({tasks.length}):</h3>
          <pre>{JSON.stringify(tasks, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestStore;
