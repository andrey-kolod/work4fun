// src/lib/auth.ts
import { NextAuthOptions, User } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

// declare module 'next-auth' {
//   interface User {
//     role?: string;
//   }
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//       name?: string | null;
//       role?: string;
//     };
//   }
// }

// declare module 'next-auth/jwt' {
//   interface JWT {
//     role?: string;
//     id?: string;
//   }
// }

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.isActive) {
          return null;
        }

        try {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }
        } catch (error) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id && token.role) {
        session.user.id = token.id.toString();
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};
