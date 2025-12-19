// next.config.js
// Это основной конфигурационный файл Next.js
// Здесь мы настраиваем поведение приложения: оптимизацию, изображения, компиляцию и т.д.

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Включаем новый React Compiler (экспериментальная фича для оптимизации рендера)
  reactCompiler: true,

  // Отключаем source maps в продакшене (чтобы не показывать исходный код в браузере)
  productionBrowserSourceMaps: false,

  // Указываем пакеты, которые используются на сервере (чтобы Next.js правильно их бандлил)
  serverExternalPackages: ['@prisma/client', 'bcrypt'],

  // === УДАЛЕНИЕ console.log В ПРОДАКШЕНЕ ===
  // Эта функция изменяет конфигурацию Webpack
  // Мы добавляем плагин Terser, который удаляет все console.log и debugger в клиентском бандле (не в dev и не на сервере)
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Только в продакшене и только для клиентского кода (не серверного)
    if (!dev && !isServer) {
      try {
        // Подключаем TerserPlugin — он минифицирует и оптимизирует JS
        const TerserPlugin = require('terser-webpack-plugin');

        // Убеждаемся, что есть раздел optimization
        config.optimization = config.optimization || {};
        config.optimization.minimizer = config.optimization.minimizer || [];

        // Добавляем наш плагин
        config.optimization.minimizer.push(
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true, // Удаляем все console.log, console.warn и т.д.
                drop_debugger: true, // Удаляем debugger;
              },
            },
          })
        );
      } catch (error) {
        // Если Terser не установлен — просто предупреждаем (не ломаем сборку)
        console.warn('⚠️ TerserPlugin не найден — console.log останутся в продакшене');
      }
    }
    return config;
  },

  // === ПОДДЕРЖКА ВНЕШНИХ ИЗОБРАЖЕНИЙ ===
  // Next.js по умолчанию блокирует внешние изображения для безопасности
  // Мы разрешаем загрузку аватаров с Dicebear и включаем поддержку SVG
  images: {
    // Разрешаем SVG (иначе Next.js возвращает 400 ошибку)
    dangerouslyAllowSVG: true,

    // Добавляем защиту от XSS в SVG-файлах
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Разрешаем все изображения с api.dicebear.com
    remotePatterns: [
      {
        protocol: 'https', // Только HTTPS
        hostname: 'api.dicebear.com', // Домен
        port: '', // Порт не указываем
        pathname: '/**', // Все пути на этом домене
      },
    ],
  },
};

export default nextConfig;
