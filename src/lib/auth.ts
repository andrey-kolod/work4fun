// src/lib/auth.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prismaRaw } from '@/lib/prisma-raw';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validations/auth';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

const isDev = process.env.NODE_ENV === 'development';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET не установлен в .env');
}
if (!process.env.NEXTAUTH_REFRESH_SECRET) {
  throw new Error('NEXTAUTH_REFRESH_SECRET не установлен в .env');
}

function generateAccessToken(userId: string, email: string, role?: Role): string {
  return jwt.sign({ sub: userId, email, role }, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '15m',
  });
}

function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, process.env.NEXTAUTH_REFRESH_SECRET!, {
    expiresIn: '30d',
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaRaw),

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (isDev) console.log('🔐 [AUTHORIZE] Попытка входа:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль');
        }

        const validationResult = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validationResult.success) {
          throw new Error('Неверный формат данных');
        }

        const { email, password } = validationResult.data;
        const rememberMe = credentials.rememberMe === 'on';

        const user = await prismaRaw.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        // SELECT * FROM "User" WHERE email = $1 LIMIT 1

        if (!user) throw new Error('Неверный email или пароль');

        const passwordField = user.passwordHash || (user as any).password;
        if (!passwordField) throw new Error('Ошибка аутентификации');

        const isPasswordValid = await bcrypt.compare(password, passwordField);
        if (!isPasswordValid) throw new Error('Неверный email или пароль');

        if (!user.emailVerified) throw new Error('Подтвердите email');

        if (isDev)
          console.log(
            `✅ [AUTHORIZE] Успех:: ${user.id} (${user.role}), rememberMe: ${rememberMe}`
          );

        return {
          id: String(user.id),
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          role: user.role as Role,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
          avatar: user.avatar ?? undefined,
          rememberMe,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // Базовое значение
  },

  // 🔥 КЛЮЧЕВОЕ: кастомные cookies с правильными сроками
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (isDev) console.log('🔑 [JWT] callback', { hasUser: !!user, tokenId: token.id });

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.avatar = user.avatar;

        // 🔧 ИЗМЕНЕНО: 16 часов вместо 1 дня
        const sessionSeconds = user.rememberMe ? 30 * 24 * 60 * 60 : 16 * 60 * 60;
        token.maxAge = sessionSeconds;
        token.rememberMe = user.rememberMe; // Для middleware

        if (isDev) {
          console.log(
            `⏳ [JWT] Сессия установлена на ${user.rememberMe ? '30 дней' : '16 часов'} (maxAge: ${sessionSeconds}s)`
          );
        }

        token.accessToken = generateAccessToken(user.id, user.email, user.role);
        token.refreshToken = generateRefreshToken(user.id, user.email);
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;

        return token;
      }

      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires - 5 * 60 * 1000) {
        try {
          const decoded = jwt.verify(
            token.refreshToken as string,
            process.env.NEXTAUTH_REFRESH_SECRET!
          ) as { sub: string };
          token.accessToken = generateAccessToken(
            decoded.sub,
            token.email as string,
            token.role as Role
          );
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        } catch {
          token.error = 'RefreshFailed';
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.firstName = token.firstName as string | undefined;
        session.user.lastName = token.lastName as string | undefined;
        session.user.avatar = token.avatar as string | undefined;
      }

      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      session.maxAge = token.maxAge;

      return session;
    },
  },

  // 🔥 Events для установки правильного срока cookie при логине
  events: {
    async signIn({ token, user, account }: any) {
      if (account?.provider === 'credentials' && token && user) {
        const rememberMe = (user as any).rememberMe;
        const sessionSeconds = rememberMe ? 30 * 24 * 60 * 60 : 16 * 60 * 60;

        if (isDev) {
          console.log(
            `🎯 [EVENTS.signIn] Устанавливаем cookie на ${rememberMe ? '30 дней' : '16 часов'}`
          );
        }

        // NextAuth автоматически применит token.maxAge к cookie при наличии cookies.sessionToken
      }
    },
  },

  pages: { signIn: '/login', error: '/login' },
  debug: isDev,
  secret: process.env.NEXTAUTH_SECRET,
};
