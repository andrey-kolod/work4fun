// next.config.js

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,

  // Убедитесь, что эти пакеты правильно настроены для Edge
  serverExternalPackages: ['@prisma/client', 'bcrypt'],

  // Явно указываем runtime для middleware
  experimental: {
    // Это поможет с совместимостью Prisma в Edge Runtime
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
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
        console.warn('⚠️ TerserPlugin не найден — console.log останутся в продакшене');
      }
    }
    return config;
  },

  images: {
    dangerouslyAllowSVG: true,
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

  // Для поддержки middleware в Edge Runtime
  // Если хотите использовать Edge Runtime с Prisma, нужно настроить Prisma Accelerate
  // Или оставить Node.js runtime (как указано в middleware выше)
};

export default nextConfig;
