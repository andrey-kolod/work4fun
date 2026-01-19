// // next.config.ts

// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   reactCompiler: true,
//   productionBrowserSourceMaps: false,

//   serverExternalPackages: ['@prisma/client', 'bcrypt', 'bcryptjs'],

//   webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
//     if (!dev && !isServer) {
//       try {
//         const TerserPlugin = require('terser-webpack-plugin');

//         config.optimization = config.optimization || {};
//         config.optimization.minimizer = config.optimization.minimizer || [];

//         config.optimization.minimizer.push(
//           new TerserPlugin({
//             terserOptions: {
//               compress: {
//                 drop_console: true,
//                 drop_debugger: true,
//               },
//             },
//           })
//         );
//       } catch (error) {
//         console.warn('⚠️ TerserPlugin не найден — console.log останутся в продакшене');
//       }
//     }
//     return config;
//   },

//   images: {
//     contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'api.dicebear.com',
//         port: '',
//         pathname: '/**',
//       },
//     ],
//   },
// };

// export default nextConfig;

// next.config.ts (добавь или обнови experimental блок)

// next.config.ts

// Объяснение для новичка: next.config.ts — это конфигурационный файл Next.js, где мы настраиваем поведение приложения, такие как экспериментальные фичи, webpack-плагины, изображения и т.д.
// Библиотека Next.js использует этот файл, чтобы кастомизировать сервер, билд и рантайм. Здесь мы добавляем экспериментальные фичи, если они нужны, но в твоей версии Next.js (вероятно 14+ по дате 2026) свойство 'middlewareSource' не поддерживается в типе ExperimentalConfig — это и вызывает ошибку TypeScript (ts(2353)).
// Почему не работает: TypeScript проверяет типы, и ExperimentalConfig имеет фиксированный набор свойств (например, appDir, turbo и т.д.). 'middlewareSource' было в старых экспериментальных версиях, но сейчас middleware всегда в src/middleware.ts.
// Лучшая практика для продакшена: используй стандартное имя файла middleware.ts — это упрощает код, избегает экспериментальных флагов (которые могут быть deprecated) и делает проект совместимым с будущими версиями Next.js. Нет нужды в 'middlewareSource'.
// Рекомендация: переименуй src/proxy.ts в src/middleware.ts — это решит ошибку без изменений в next.config.ts. Если в проекте уже есть middleware.ts (по структуре репозитория), интегрируй код из proxy.ts в него или удали ненужный.
// Если запросы к Prisma: после каждого Prisma-запроса добавь закомментированный SQL для отладки (но в этом файле Prisma не используется).
// Все изменения помечены // ИЗМЕНЕНО: ...

// next.config.ts
// Этот файл — конфигурация Next.js. Он определяет, как приложение собирается и работает.
// Здесь мы настраиваем:
// - webpack (минификация в продакшене)
// - внешние пакеты на сервере (чтобы Prisma и bcrypt работали на сервере)
// - изображения (remotePatterns для Dicebear, CSP)
// - экспериментальные фичи (если нужны)

// Важно:
// - experimental.middlewareSource НЕ существует в современных версиях Next.js (14+)
// - middleware всегда лежит в файле src/middleware.ts (или в корне проекта)
// - Если ты оставляешь src/proxy.ts, Next.js его НЕ подхватит автоматически
//   → либо переименуй в src/middleware.ts
//   → либо используй временный хак через плагин (но это не рекомендуется для продакшена)
// Лучшая практика: переименуй proxy.ts → middleware.ts и удали экспериментальный флаг

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,

  serverExternalPackages: ['@prisma/client', 'bcrypt', 'bcryptjs'],

  // webpack-конфиг — минификация в продакшене (удаляем console.log и debugger)
  webpack: (config, { dev, isServer }) => {
    // dev и isServer — это параметры, которые Next.js передаёт в webpack-функцию
    // dev === true в режиме разработки (npm run dev)
    // isServer === true когда собирается серверная часть
    if (!dev && !isServer) {
      try {
        const TerserPlugin = require('terser-webpack-plugin');

        config.optimization = config.optimization || {};
        config.optimization.minimizer = config.optimization.minimizer || [];

        config.optimization.minimizer.push(
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            },
          })
        );
      } catch (error) {
        // ИЗМЕНЕНО: логируем только в dev-режиме, чтобы не засорять продакшен-логи
        if (dev) {
          console.warn('⚠️ TerserPlugin не найден — console.log останутся в продакшене');
        }
      }
    }

    return config;
  },

  images: {
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // НЕ добавляем experimental.middlewareSource — оно не существует в типе ExperimentalConfig
  // Вместо этого: переименуй src/proxy.ts → src/middleware.ts
  // Next.js автоматически найдёт и использует middleware.ts
};

export default nextConfig;
