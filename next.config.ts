// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
};

export default nextConfig;
