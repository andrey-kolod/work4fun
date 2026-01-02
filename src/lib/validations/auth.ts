// ФАЙЛ: /src/lib/validations/auth.ts

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен для заполнения')
    .email('Введите корректный email адрес')
    .max(255, 'Email не может быть длиннее 255 символов')
    .transform((email) => email.toLowerCase().trim()),

  password: z.string().min(1, 'Пароль обязателен для заполнения'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email обязателен для заполнения')
      .email('Введите корректный email адрес')
      .max(255, 'Email не может быть длиннее 255 символов')
      .transform((email) => email.toLowerCase().trim()),

    firstName: z
      .string()
      .min(2, 'Имя должно содержать от 2 до 50 символов')
      .max(50, 'Имя должно содержать от 2 до 50 символов')
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/, // Буквы (рус/англ), пробелы, дефисы, апострофы.
        'Имя может содержать только буквы, пробелы, дефисы и апострофы'
      )
      .transform((name) => name.trim()),

    lastName: z
      .string()
      .min(2, 'Фамилия должна содержать от 2 до 50 символов')
      .max(50, 'Фамилия должна содержать от 2 до 50 символов')
      .regex(
        /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/,
        'Фамилия может содержать только буквы, пробелы, дефисы и апострофы'
      )
      .transform((name) => name.trim()),

    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[\d\s+()-]+$/.test(val), // Только цифры/пробелы/скобки/+
        { message: 'Телефон может содержать только цифры, пробелы, скобки и знак +' }
      )
      .transform((phone) => phone?.trim() || undefined),

    password: z
      .string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву (a-z)')
      .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву (A-Z)')
      .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру (0-9)'),

    confirmPassword: z.string().min(1, 'Подтвердите пароль'),

    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'Необходимо согласиться с пользовательским соглашением',
    }),

    agreeToPrivacy: z.boolean().refine((val) => val === true, {
      message: 'Необходимо согласиться с политикой конфиденциальности',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
