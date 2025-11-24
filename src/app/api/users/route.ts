// src/app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const userService = new UserService();

    const users = await userService.getAllUsers(
      projectId ? parseInt(projectId) : undefined,
      session.user.role,
    );
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const userService = new UserService();
    const user = await userService.createUser(body, parseInt(session.user.id));
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message === 'User with this email already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// КОММЕНТЫ
// =============================================================================
// // API ENDPOINT ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ - /api/users
// // =============================================================================

// // 📦 ИМПОРТЫ
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { UserService } from '@/lib/services/userService';

// /**
//  * 🎯 GET /api/users - ПОЛУЧЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ
//  *
//  * 📍 ДОСТУП: Все авторизованные пользователи
//  * 📍 ПАРАМЕТРЫ: projectId (опционально) - фильтр по проекту
//  * 📍 ВОЗВРАТ: Массив пользователей или ошибка
//  *
//  * 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
//  *
//  * Пример 1: Получить всех пользователей
//  * fetch('/api/users')
//  *   .then(response => response.json())
//  *   .then(users => console.log(users))
//  *
//  * Пример 2: Получить пользователей проекта 5
//  * fetch('/api/users?projectId=5')
//  *   .then(response => response.json())
//  *   .then(users => console.log(users))
//  */
// export async function GET(request: NextRequest) {
//   try {
//     // 🔐 ШАГ 1: ПРОВЕРКА АВТОРИЗАЦИИ
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // 🔍 ШАГ 2: ПОЛУЧЕНИЕ ПАРАМЕТРОВ ИЗ URL
//     const { searchParams } = new URL(request.url);
//     const projectId = searchParams.get('projectId');

//     // 🛠️ ШАГ 3: ИСПОЛЬЗОВАНИЕ USER SERVICE
//     const userService = new UserService();
//     const users = await userService.getAllUsers(
//       projectId ? parseInt(projectId) : undefined,
//       session.user.role
//     );

//     // ✅ ШАГ 4: ВОЗВРАТ УСПЕШНОГО ОТВЕТА
//     return NextResponse.json(users);
//   } catch (error) {
//     // ❌ ШАГ 5: ОБРАБОТКА ОШИБОК
//     console.error('Error fetching users:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * 🎯 POST /api/users - СОЗДАНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ
//  *
//  * 📍 ДОСТУП: Только SUPER_ADMIN и ADMIN
//  * 📍 ТЕЛО ЗАПРОСА: JSON с данными пользователя
//  * 📍 ВОЗВРАТ: Созданный пользователь или ошибка
//  *
//  * 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
//  *
//  * Пример: Создать нового пользователя
//  * fetch('/api/users', {
//  *   method: 'POST',
//  *   headers: { 'Content-Type': 'application/json' },
//  *   body: JSON.stringify({
//  *     email: 'new@user.com',
//  *     password: 'password123',
//  *     firstName: 'John',
//  *     lastName: 'Doe',
//  *     role: 'USER',
//  *     projectIds: [1, 2],
//  *     groupIds: [3, 4]
//  *   })
//  * })
//  */
// export async function POST(request: NextRequest) {
//   try {
//     // 🔐 ШАГ 1: ПРОВЕРКА ПРАВ ДОСТУПА
//     const session = await getServerSession(authOptions);
//     if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // 📦 ШАГ 2: ПОЛУЧЕНИЕ ДАННЫХ ИЗ ЗАПРОСА
//     const body = await request.json();
//     const userService = new UserService();

//     // ➕ ШАГ 3: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
//     const user = await userService.createUser(
//       body,
//       parseInt(session.user.id)
//     );

//     // ✅ ШАГ 4: ВОЗВРАТ УСПЕШНОГО ОТВЕТА
//     return NextResponse.json(user, { status: 201 });
//   } catch (error: any) {
//     // ❌ ШАГ 5: ДЕТАЛЬНАЯ ОБРАБОТКА ОШИБОК
//     console.error('Error creating user:', error);

//     // Конфликт - пользователь с таким email уже существует
//     if (error.message === 'User with this email already exists') {
//       return NextResponse.json(
//         { error: error.message },
//         { status: 409 }
//       );
//     }

//     // Любая другая ошибка
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
