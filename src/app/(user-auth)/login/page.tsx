// src/app/(user-auth)/login/page.tsx

'use client'; // КЛИЕНТСКИЙ КОМПОНЕНТ - выполняется в браузере

import { useState } from 'react'; // Хук для управления состоянием
import { signIn } from 'next-auth/react'; // Функция входа в систему
import { useRouter } from 'next/navigation'; // Навигация между страницами
import Link from 'next/link'; // Компонент для ссылок

export default function LoginPage() {
  // СОСТОЯНИЕ КОМПОНЕНТА:
  // 1. Email пользователя
  const [email, setEmail] = useState('superadmin@workflow.com');
  // 2. Пароль пользователя
  const [password, setPassword] = useState('demo123');
  // 3. Флаг загрузки (true когда идет процесс входа)
  const [isLoading, setIsLoading] = useState(false);
  // 4. Текст ошибки (если вход не удался)
  const [error, setError] = useState('');
  // 5. Хук для навигации по страницам
  const router = useRouter();

  // ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ
  const handleSubmit = async (e: React.FormEvent) => {
    // 1. Блокируем стандартное поведение формы (перезагрузку страницы)
    e.preventDefault();

    // 2. Включаем состояние загрузки и очищаем ошибки
    setIsLoading(true);
    setError('');

    // 3. Пытаемся выполнить вход
    try {
      // Вызываем NextAuth для входа с email и паролем
      const result = await signIn('credentials', {
        email, // Введенный email
        password, // Введенный пароль
        redirect: false, // Не перенаправлять автоматически
      });

      // 4. Проверяем результат
      if (result?.error) {
        // Если есть ошибка - показываем сообщение
        setError('Неверный email или пароль');
      } else {
        // Если успешно - переходим на выбор проекта
        router.push('/project-select');
      }
    } catch (error) {
      // Ловим непредвиденные ошибки
      setError('Произошла ошибка при входе');
    } finally {
      // Всегда выключаем индикатор загрузки
      setIsLoading(false);
    }
  };

  // РАЗМЕТКА КОМПОНЕНТА
  return (
    <div className="bg-surface rounded-lg shadow-sm p-8">
      {/* ЗАГОЛОВОК */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Вход в систему</h2>
        <p className="text-text-secondary mt-2">Введите свои учетные данные для входа</p>
      </div>

      {/* ФОРМА ВХОДА */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* БЛОК ОШИБКИ (показывается только если error не пустой) */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ПОЛЕ EMAIL */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Обновляем состояние при вводе
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="your@email.com"
            required
            disabled={isLoading} // Отключаем поле во время загрузки
          />
        </div>

        {/* ПОЛЕ ПАРОЛЯ */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Ваш пароль"
            required
            disabled={isLoading}
          />
        </div>

        {/* КНОПКА ВХОДА */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            // Индикатор загрузки (крутящийся спиннер)
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Вход...
            </div>
          ) : (
            // Обычный текст кнопки
            'Войти'
          )}
        </button>
      </form>

      {/* ДЕМО ДОСТУПЫ ДЛЯ ТЕСТИРОВАНИЯ */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Демо доступы:</h3>

        {/* 👑 СУПЕР-АДМИН */}
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="text-xs font-medium text-purple-600 mb-1">
            👑 СУПЕР-АДМИН (все проекты)
          </div>
          <div className="text-xs">superadmin@workflow.com / demo123</div>
        </div>

        {/* 👨‍💼 АДМИНЫ ПРОЕКТОВ */}
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="text-xs font-medium text-blue-600 mb-1">👨‍💼 АДМИНЫ ПРОЕКТОВ</div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Ольга (Успешный бизнес):</strong> admin.olya@workflow.com / demo123
            </div>
            <div>
              <strong>Славка (Начинающий бизнес):</strong> admin.slava@workflow.com / demo123
            </div>
          </div>
        </div>

        {/* 👥 СОТРУДНИКИ - УСПЕШНЫЙ БИЗНЕС */}
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="text-xs font-medium text-green-600 mb-1">👥 УСПЕШНЫЙ БИЗНЕС (Ольга)</div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>ОЗОН - Алена:</strong> bussiness.manager@wf.com / demo123
            </div>
            <div>
              <strong>ОЗОН - Лена:</strong> bussiness.manager2@wf.com / demo123
            </div>
            <div>
              <strong>WB - Аня:</strong> bussiness.manager3@wf.com / demo123
            </div>
            <div>
              <strong>WB - Боно:</strong> bussiness.manager4@wf.com / demo123
            </div>
          </div>
        </div>

        {/* 👥 СОТРУДНИКИ - НАЧИНАЮЩИЙ БИЗНЕС */}
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="text-xs font-medium text-orange-600 mb-1">
            👥 НАЧИНАЮЩИЙ БИЗНЕС (Славка)
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Маша:</strong> bussiness2.manager1@wf.com / demo123
            </div>
            <div>
              <strong>Миша:</strong> bussiness2.manager2@wf.com / demo123
            </div>
            <div>
              <strong>Саша:</strong> bussiness2.manager3@wf.com / demo123
            </div>
          </div>
        </div>

        {/* 👥 СОТРУДНИКИ - ДОМАШНИЕ ДЕЛА */}
        <div className="mb-2">
          <div className="text-xs font-medium text-pink-600 mb-1">👥 ДОМАШНИЕ ДЕЛА</div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Викуша:</strong> super.devochka@wf.com / demo123
            </div>
          </div>
        </div>

        {/* 💡 ПОДСКАЗКИ */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-text-secondary mb-1">💡 Особенности системы:</h4>
          <div className="text-xs text-gray-500 space-y-0.5">
            <div>
              • <strong>Супер-админ</strong> видит ВСЕ проекты
            </div>
            <div>
              • <strong>Админы</strong> видят только свои проекты
            </div>
            <div>
              • <strong>Сотрудники</strong> видят только назначенные проекты
            </div>
            <div>• После входа выберите проект для работы</div>
          </div>
        </div>
      </div>
    </div>
  );
}
