'use client';

// Импортируем наш store
import { useAppStore } from '@/store/useAppStore';

// Компонент для тестирования Zustand store
export function TestStore() {
  // Достаем данные и функции из store
  // useAppStore - это хук, который дает доступ к состоянию и действиям
  const {
    currentUser,
    isAuthenticated,
    sidebarOpen,
    users,
    setSidebarOpen,
    setCurrentUser,
    addUser,
    logout,
  } = useAppStore();

  // Функция для тестирования входа пользователя
  const testLogin = (): void => {
    // Создаем тестового пользователя
    const testUser: any = {
      id: 1,
      name: 'Тестовый пользователь',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Вызываем действие из store для установки пользователя
    setCurrentUser(testUser);
  };

  // Функция для тестирования добавления пользователя
  const testAddUser = (): void => {
    // Создаем нового пользователя
    const newUser: any = {
      id: Date.now(), // используем timestamp как временный ID
      name: `Новый пользователь ${users.length + 1}`,
      email: `user${users.length + 1}@example.com`,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Вызываем действие из store для добавления пользователя
    addUser(newUser);
  };

  // Функция для выхода
  const handleLogout = (): void => {
    logout();
  };

  return (
    <div
      style={{
        padding: '20px',
        border: '2px solid #4CAF50',
        margin: '10px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>🧪 Тест Zustand Store</h3>

      {/* Информация о текущем состоянии */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Текущий пользователь:</strong> {currentUser?.name || 'Не авторизован'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Авторизован:</strong> {isAuthenticated ? '✅ Да' : '❌ Нет'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Сайдбар открыт:</strong> {sidebarOpen ? '✅ Да' : '❌ Нет'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Количество пользователей:</strong> {users.length}
      </div>

      {/* Кнопки для тестирования */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={testLogin}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔐 Тестовый вход
        </button>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '📕 Закрыть' : '📖 Открыть'} сайдбар
        </button>

        <button
          onClick={testAddUser}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          👤 Добавить пользователя
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🚪 Выйти
        </button>
      </div>

      {/* Показываем список пользователей если они есть */}
      {users.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4>📋 Список пользователей:</h4>
          <ul style={{ paddingLeft: '20px' }}>
            {users.map((user: any) => (
              <li key={user.id}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
