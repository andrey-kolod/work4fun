// work4fun/src/app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserById(parseInt(params.id), session.user.role);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);

    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userService = new UserService();
    const user = await userService.updateUser(
      parseInt(params.id),
      body,
      parseInt(session.user.id),
      request,
    );

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// КОММЕНТЫ

// // =============================================================================
// // API ENDPOINT ДЛЯ РАБОТЫ С КОНКРЕТНЫМ ПОЛЬЗОВАТЕЛЕМ - /api/users/[id]
// // =============================================================================

// // 📦 ИМПОРТЫ
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { UserService } from '@/lib/services/userService';

// /**
//  * 🎯 RouteParams - интерфейс для параметров динамического маршрута
//  */
// interface RouteParams {
//   params: {
//     id: string;  // ID пользователя из URL (всегда строка)
//   };
// }

// /**
//  * 🎯 GET /api/users/[id] - ПОЛУЧЕНИЕ ДАННЫХ КОНКРЕТНОГО ПОЛЬЗОВАТЕЛЯ
//  *
//  * 📍 ДОСТУП: Все авторизованные пользователи (с ограничениями для ADMIN)
//  * 📍 ПАРАМЕТРЫ: id - ID пользователя из URL
//  * 📍 ВОЗВРАТ: Данные пользователя или ошибка
//  *
//  * 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
//  *
//  * Пример: Получить пользователя с ID 5
//  * fetch('/api/users/5')
//  *   .then(response => response.json())
//  *   .then(user => console.log(user))
//  */
// export async function GET(request: NextRequest, { params }: RouteParams) {
//   try {
//     // 🔐 ШАГ 1: ПРОВЕРКА АВТОРИЗАЦИИ
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // 🛠️ ШАГ 2: ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
//     const userService = new UserService();
//     const user = await userService.getUserById(
//       parseInt(params.id),
//       session.user.role
//     );

//     // 🔍 ШАГ 3: ПРОВЕРКА НАЙДЕН ЛИ ПОЛЬЗОВАТЕЛЬ
//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     // ✅ ШАГ 4: ВОЗВРАТ УСПЕШНОГО ОТВЕТА
//     return NextResponse.json(user);
//   } catch (error: any) {
//     // ❌ ШАГ 5: ОБРАБОТКА ОШИБОК
//     console.error('Error fetching user:', error);

//     // Ошибка доступа - нет прав для просмотра этого пользователя
//     if (error.message === 'Access denied') {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     // Любая другая ошибка
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * 🎯 PUT /api/users/[id] - ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
//  *
//  * 📍 ДОСТУП: Только SUPER_ADMIN и ADMIN
//  * 📍 ПАРАМЕТРЫ: id - ID пользователя из URL
//  * 📍 ТЕЛО ЗАПРОСА: JSON с данными для обновления
//  * 📍 ВОЗВРАТ: Обновленный пользователь или ошибка
//  *
//  * 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
//  *
//  * Пример: Обновить пользователя с ID 5
//  * fetch('/api/users/5', {
//  *   method: 'PUT',
//  *   headers: { 'Content-Type': 'application/json' },
//  *   body: JSON.stringify({
//  *     firstName: 'John',
//  *     lastName: 'Smith',
//  *     role: 'ADMIN',
//  *     projectIds: [1, 2]
//  *   })
//  * })
//  */
// export async function PUT(request: NextRequest, { params }: RouteParams) {
//   try {
//     // 🔐 ШАГ 1: ПРОВЕРКА ПРАВ ДОСТУПА
//     const session = await getServerSession(authOptions);
//     if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // 📦 ШАГ 2: ПОЛУЧЕНИЕ ДАННЫХ ИЗ ЗАПРОСА
//     const body = await request.json();
//     const userService = new UserService();

//     // ✏️ ШАГ 3: ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
//     const user = await userService.updateUser(
//       parseInt(params.id),
//       body,
//       parseInt(session.user.id)
//     );

//     // ✅ ШАГ 4: ВОЗВРАТ УСПЕШНОГО ОТВЕТА
//     return NextResponse.json(user);
//   } catch (error: any) {
//     // ❌ ШАГ 5: ОБРАБОТКА ОШИБОК
//     console.error('Error updating user:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
