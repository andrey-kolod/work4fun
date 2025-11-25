// /src/schemas/user.ts

// import { z } from 'zod';

// export const userCreateSchema = z.object({
//   firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
//   lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
//   email: z
//     .string()
//     .min(1, 'Email обязателен')
//     .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Некорректный email'),
//   password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
//   role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
//   groupId: z.number().optional(),
// });

// export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// export type UserCreateData = z.infer<typeof userCreateSchema>;
// export type UserUpdateData = z.infer<typeof userUpdateSchema>;

import { z } from 'zod';
import { CreateUserData } from '@/types/user';

export const userCreateSchema = z.object({
  firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
  email: z
    .string()
    .min(1, 'Email обязателен')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  groupId: z.number().optional(),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
