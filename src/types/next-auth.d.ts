// ============================================================================
// ФАЙЛ: /src/types/next-auth.d.ts
// НАЗНАЧЕНИЕ: Расширение типов TypeScript для NextAuth
// ----------------------------------------------------------------------------
// TypeScript не знает о наших кастомных полях (firstName, lastName, role),
// которые мы добавляем в User, Session и JWT.
// Этот файл сообщает TypeScript о новых полях.
//
// Без этого файла будут ошибки при обращении к:
// - session.user.firstName
// - useSession().data.user.role
// ============================================================================

import 'next-auth'; // Импортируем базовые типы NextAuth
import { Role } from '@prisma/client'; // Импортируем наш enum Role из Prisma

// Расширяем модуль 'next-auth'
declare module 'next-auth' {
  /**
   * ИНТЕРФЕЙС: User (Пользователь)
   * Расширяем стандартный интерфейс пользователя NextAuth.
   * Добавляем поля, которые есть в нашей базе данных.
   */
  interface User {
    id: string; // ID пользователя
    email: string; // Email
    firstName: string; // Имя (наше кастомное поле)
    lastName: string; // Фамилия (наше кастомное поле)
    role: Role; // Роль (SUPER_ADMIN, PROJECT_LEAD, PROJECT_MEMBER)
    name?: string | null; // Имя для отображения (уже есть в NextAuth)
  }

  /**
   * ИНТЕРФЕЙС: Session (Сессия)
   * Расширяем интерфейс сессии.
   * Сессия - объект с данными пользователя, доступный во всем приложении.
   * Доступ через: useSession().data
   */
  interface Session {
    user: {
      id: string; // ID пользователя
      email: string; // Email
      name?: string | null; // Имя для отображения
      firstName: string; // Имя (наше поле)
      lastName: string; // Фамилия (наше поле)
      role: Role; // Роль пользователя
    };
  }
}

// Расширяем модуль 'next-auth/jwt' для JWT токенов
declare module 'next-auth/jwt' {
  /**
   * ИНТЕРФЕЙС: JWT (JSON Web Token)
   * JWT токен - зашифрованные данные о пользователе.
   * Хранится в cookies браузера, передается с каждым запросом.
   */
  interface JWT {
    id: string; // ID пользователя
    firstName: string; // Имя
    lastName: string; // Фамилия
    role: Role; // Роль
    email?: string; // Email (опционально)
  }
}
