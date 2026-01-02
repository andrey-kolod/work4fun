// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LayoutProvider } from '@/contexts/LayoutContext';
import ClientLayout from '../components/layout/ClientLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Work4Fun - Управление задачами',
  description: 'Современная система управления проектами и задачами',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-transparent`}>
        <AuthProvider>
          <LayoutProvider>
            <ClientLayout>{children}</ClientLayout>
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
