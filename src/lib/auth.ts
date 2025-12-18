// ФАЙЛ: /src/lib/auth.ts
// НАЗНАЧЕНИЕ: Основная конфигурация аутентификации в приложении Next.js

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validations/auth';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

const isDev = process.env.NODE_ENV === 'development';

if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET не установлена!');
  throw new Error('NEXTAUTH_SECRET is required');
}

if (!process.env.NEXTAUTH_REFRESH_SECRET) {
  console.error('❌ NEXTAUTH_REFRESH_SECRET не установлена!');
  throw new Error('NEXTAUTH_REFRESH_SECRET is required');
}

function generateAccessToken(userId: string, email: string, role?: Role): string {
  const payload = { sub: userId, email, role };
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '15m', // 15 минут
  });
}

function generateRefreshToken(userId: string, email: string): string {
  const payload = { sub: userId, email };
  return jwt.sign(payload, process.env.NEXTAUTH_REFRESH_SECRET!, {
    expiresIn: '30d', // 30 дней
  });
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
        if (isDev) console.log('🔐 [AUTHORIZE]', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль');
        }

        const validationResult = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validationResult.success) {
          throw new Error('Неверный формат email или пароля');
        }

        const { email, password } = validationResult.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) throw new Error('Неверный email или пароль');

        const passwordField = user.passwordHash || (user as any).password;
        if (!passwordField) throw new Error('Ошибка аутентификации');

        const isPasswordValid = await bcrypt.compare(password, passwordField);
        if (!isPasswordValid) throw new Error('Неверный email или пароль');

        if (!user.emailVerified) throw new Error('Подтвердите email перед входом');

        if (isDev) console.log(`✅ [AUTHORIZE] ${user.id} (${user.role})`);

        return {
          id: String(user.id),
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role as Role,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
          avatar: user.avatar || null,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },

  callbacks: {
    // REFRESH
    async jwt({ token, user }: any) {
      // DEV ЛОГИ
      if (isDev) {
        console.log('🔑 [JWT]', {
          hasUser: !!user,
          hasAccess: !!token.accessToken,
          timeLeft: token.accessTokenExpires
            ? Math.floor((token.accessTokenExpires - Date.now()) / 1000 / 60) + 'm'
            : 'N/A',
        });
      }

      // ПЕРВЫЙ ЛОГИН
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.avatar = user.avatar;

        // СОЗДАЁМ ТОКЕНЫ
        token.accessToken = generateAccessToken(user.id, user.email, user.role);
        token.refreshToken = generateRefreshToken(user.id, user.email);
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000; // 15 мин

        if (isDev) {
          console.log('✅ [JWT] Токены созданы → 15m');
        }
        return token;
      }

      // 2. REFRESH CHECK
      if (!token.accessToken || typeof token.accessTokenExpires !== 'number') {
        if (isDev) console.log('❌ [JWT] Нет токенов');
        return token;
      }

      const timeLeft = Math.floor((token.accessTokenExpires - Date.now()) / 1000 / 60); // остаток в минутах
      if (isDev) console.log('⏰ [JWT] Осталось:', timeLeft, 'мин');

      // REFRESH ЕСЛИ <5 МИНУТ
      if (timeLeft < 5) {
        if (isDev) console.log('🚀 [JWT] REFRESH <5 мин');
        try {
          const decoded = jwt.verify(
            token.refreshToken as string,
            process.env.NEXTAUTH_REFRESH_SECRET!
          ) as { sub: string; email: string };

          token.accessToken = generateAccessToken(decoded.sub, decoded.email, token.role);
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000; // +15 мин

          if (isDev) {
            console.log('✅ [JWT] REFRESH УСПЕШЕН → 15m');
          }
        } catch (error: any) {
          if (isDev) console.error('💥 [JWT] Refresh failed:', error.message);
          token.error = 'RefreshFailed';
          token.accessToken = null;
        }
      }

      return token;
    },

    // SESSION
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.avatar = token.avatar as string | null;
        session.user.name = token.name || (token.email as string);
      }

      // AccessToken для API
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;

      return session;
    },
  },

  pages: { signIn: '/login', error: '/login' },
  debug: isDev,
  secret: process.env.NEXTAUTH_SECRET,
};
