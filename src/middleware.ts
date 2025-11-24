// directworkflow/middleware.ts
// Защищает маршруты и API с помощью next-auth и настраивает доступ на основе ролей пользователей.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const token = request.nextauth?.token;
    const pathname = request.nextUrl.pathname;

    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (pathname.startsWith('/admin')) {
      if (token?.role === 'SUPER_ADMIN') {
        return NextResponse.next();
      }

      if (token?.role === 'ADMIN') {
        if (pathname.startsWith('/admin/system')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/api')) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (
        pathname.startsWith('/api/admin') &&
        token.role !== 'SUPER_ADMIN' &&
        token.role !== 'ADMIN'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        const publicRoutes = ['/', '/auth/login', '/auth/register', '/api/auth', '/project-select'];

        if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

// КОММЕНТЫ:
// middleware.ts

// // middleware.ts
// // 🎯 ЭТОТ ФАЙЛ ДОЛЖЕН БЫТЬ В КОРНЕ ПРОЕКТА

// // Импортируем withAuth и специальный тип для middleware
// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// // 🔧 БОЛЬШЕ НЕ НУЖНО РАСШИРЯТЬ ТИПЫ ВРУЧНУЮ!
// // NextAuth автоматически предоставляет правильные типы
// // middleware.ts

// export default withAuth(
//   /**
//    * 🛡️ ОСНОВНАЯ ФУНКЦИЯ MIDDLEWARE
//    * NextAuth автоматически добавляет nextauth.token в request
//    * НЕ нужно указывать типы вручную - withAuth делает это за нас
//    */
//   function middleware(request) {
//     // 🔍 ШАГ 2.1: ПОЛУЧАЕМ ДАННЫЕ ИЗ ЗАПРОСА

//     // NextAuth автоматически добавляет token в request.nextauth.token
//     // token содержит: { name, email, role, sub, picture }
//     const token = request.nextauth.token;

//     // pathname - путь который запрашивает пользователь
//     const pathname = request.nextUrl.pathname;

//     console.log('🛡️ Middleware проверяет:', {
//       путь: pathname,
//       роль: token?.role,
//       email: token?.email,
//     });

//     // 🔒 ШАГ 2.2: ПРОВЕРКА ДЛЯ НЕАВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
//     if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
//       console.log('🚫 Неавторизованный доступ к защищенной странице:', pathname);
//       return NextResponse.redirect(new URL('/auth/login', request.url));
//     }

//     // 👑 ШАГ 2.3: ПРОВЕРКА ПРАВ ДЛЯ АДМИНСКИХ РАЗДЕЛОВ
//     if (pathname.startsWith('/admin')) {
//       console.log('👑 Проверка доступа к админке для роли:', token?.role);

//       // ✅ СУПЕР-АДМИН имеет доступ ко всем админским разделам
//       if (token?.role === 'SUPER_ADMIN') {
//         console.log('✅ SUPER_ADMIN - полный доступ к админке');
//         return NextResponse.next();
//       }

//       // ✅ ОБЫЧНЫЙ АДМИН имеет доступ только к определенным разделам
//       if (token?.role === 'ADMIN') {
//         // ❌ Админ НЕ имеет доступа к системным настройкам
//         if (pathname.startsWith('/admin/system')) {
//           console.log('🚫 ADMIN пытается получить доступ к системным настройкам');
//           return NextResponse.redirect(new URL('/dashboard', request.url));
//         }
//         console.log('✅ ADMIN - доступ к базовой админке');
//         return NextResponse.next();
//       }

//       // ❌ ПОЛЬЗОВАТЕЛИ не имеют доступа к админке
//       console.log('🚫 USER не имеет доступа к админке');
//       return NextResponse.redirect(new URL('/dashboard', request.url));
//     }

//     // 🔌 ШАГ 2.4: ПРОВЕРКА ДЛЯ API ROUTES
//     if (pathname.startsWith('/api')) {
//       console.log('🔌 Проверка доступа к API:', pathname);

//       // ❌ API доступно только авторизованным пользователям
//       if (!token) {
//         console.log('🚫 Неавторизованный доступ к API');
//         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//       }

//       // 🔒 ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ ДЛЯ АДМИНСКИХ API
//       if (
//         pathname.startsWith('/api/admin') &&
//         token.role !== 'SUPER_ADMIN' &&
//         token.role !== 'ADMIN'
//       ) {
//         console.log('🚫 Недостаточно прав для админского API');
//         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//       }

//       console.log('✅ Доступ к API разрешен');
//     }

//     // ✅ ШАГ 2.5: ЕСЛИ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ - пропускаем запрос
//     console.log('✅ Middleware: все проверки пройдены, запрос пропущен');
//     return NextResponse.next();
//   },
//   {
//     // ⚙️ ШАГ 2.6: КОНФИГУРАЦИЯ withAuth
//     callbacks: {
//       /**
//        * 🔐 authorized callback - определяет ДОСТУПЕН ли маршрут для пользователя
//        */
//       authorized: ({ token, req }) => {
//         const pathname = req.nextUrl.pathname;
//         console.log('🔐 Authorized callback проверяет путь:', pathname);

//         // 🌐 ПУБЛИЧНЫЕ МАРШРУТЫ
//         const publicRoutes = ['/', '/auth/login', '/auth/register', '/api/auth', '/project-select'];

//         // Проверяем если текущий путь - публичный маршрут
//         const isPublicRoute = publicRoutes.some(
//           (route) => pathname === route || pathname.startsWith(route),
//         );

//         if (isPublicRoute) {
//           console.log('🌐 Публичный маршрут - доступ разрешен для всех');
//           return true;
//         }

//         // 🔒 ДЛЯ ВСЕХ ОСТАЛЬНЫХ МАРШРУТОВ ТРЕБУЕТСЯ АВТОРИЗАЦИЯ
//         const isAuthorized = !!token;
//         console.log('🔒 Защищенный маршрут. Авторизован:', isAuthorized);
//         return isAuthorized;
//       },
//     },
//   },
// );
// // middleware.ts

// // 🎯 КОНФИГУРАЦИЯ ДЛЯ NEXT.JS
// export const config = {
//   /**
//    * 🎪 MATCHER - указываем КАКИЕ маршруты защищать
//    * Middleware будет вызываться ТОЛЬКО для этих маршрутов
//    */
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };
