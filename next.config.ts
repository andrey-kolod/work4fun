// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'bcrypt'],

  // УДАЛЕНИЕ console.log В ПРОДАКШЕНЕ
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
                drop_console: true, // ✅ УДАЛЯЕТ console.log
                drop_debugger: true,
              },
            },
          })
        );
      } catch (error) {
        console.warn('⚠️ TerserPlugin не найден - console.log останутся');
      }
    }
    return config;
  },
  // ✅ Поддержка внешних изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
