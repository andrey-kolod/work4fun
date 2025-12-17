// ФАЙЛ: /src/lib/auth.ts
// НАЗНАЧЕНИЕ: Основная конфигурация аутентификации в приложении Next.js

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validations/auth';
import { Role } from '@prisma/client';

if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ ОШИБКА: Переменная NEXTAUTH_SECRET не установлена!');
  console.error('Добавь в файл .env строку:');
  console.error('NEXTAUTH_SECRET="очень_длинный_случайный_ключ_минимум_32_символа"');
  console.error('Сгенерировать можно командой: openssl rand -base64 32');
  throw new Error('NEXTAUTH_SECRET is required');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        console.log('🔐 Попытка входа с email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль');
        }

        const validationResult = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validationResult.success) {
          console.error('Ошибка валидации:', JSON.stringify(validationResult.error, null, 2));
          throw new Error('Неверный формат email или пароля');
        }

        const { email, password } = validationResult.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
          });

          if (!user) {
            console.warn(`Пользователь не найден: ${email}`);
            throw new Error('Неверный email или пароль');
          }

          const passwordField = user.passwordHash || (user as any).password;

          if (!passwordField) {
            console.error(`У пользователя нет пароля в базе: ${user.id}`);
            throw new Error('Ошибка аутентификации');
          }

          const isPasswordValid = await bcrypt.compare(password, passwordField);

          if (!isPasswordValid) {
            console.warn(`Неверный пароль для пользователя: ${user.id}`);
            throw new Error('Неверный email или пароль');
          }

          if (!user.emailVerified) {
            console.warn(`Email не подтверждён: ${user.id}`);
            throw new Error('Подтвердите email перед входом');
          }

          console.log(`✅ Успешный вход пользователя: ${user.id} (${user.email})`);

          return {
            id: String(user.id),
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role as Role,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
            avatar: user.avatar || null,
          };
        } catch (error) {
          console.error('Ошибка при аутентификации:', error);
          throw new Error('Ошибка сервера при входе');
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          role: Role;
          avatar: string | null;
        };

        token.id = appUser.id;
        token.role = appUser.role;
        token.firstName = appUser.firstName;
        token.lastName = appUser.lastName;
        token.email = appUser.email;
        token.avatar = appUser.avatar;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.avatar = token.avatar as string | null;

        if (!session.user.name && token.email) {
          session.user.name = token.email;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ДЕБАГ И СЕКРЕТ
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
