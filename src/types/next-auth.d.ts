// ФАЙЛ: /src/types/next-auth.d.ts
// НАЗНАЧЕНИЕ: Расширение типов TypeScript для NextAuth

import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    avatar?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      firstName: string;
      lastName: string;
      role: Role;
      avatar?: string | null;
    };
    accessToken?: string; // 🔥 Новый
    error?: string; // 🔥 Новый
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
    email?: string;
    avatar?: string | null;
  }
}
