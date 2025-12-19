// next.config.js

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'bcrypt'],

  // УДАЛЕНИЕ console.log НА ПРОДЕ
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
        console.warn('⚠️ TerserPlugin не найден - console.log останутся');
      }
    }
    return config;
  },
  // Поддержка внешних изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
