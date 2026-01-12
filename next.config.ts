// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,

  serverExternalPackages: ['@prisma/client', 'bcrypt', 'bcryptjs'],

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
};

export default nextConfig;
