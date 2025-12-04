// work4fun/src/schemas/user.ts
import { z } from 'zod';

// Упрощенная схема для формы БЕЗ visibleGroups в Zod схеме
export const userFormSchema = z.object({
  firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  role: z.enum(['USER', 'ADMIN']),
  scope: z.enum(['ALL', 'SPECIFIC_GROUPS']),
  isActive: z.boolean(),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

// Тип для данных формы (без visibleGroups)
export type UserFormData = z.infer<typeof userFormSchema>;

// Расширенный тип для передачи в onSubmit
export interface UserFormDataWithGroups extends UserFormData {
  visibleGroups?: string[];
}

// Функция для создания дефолтных значений
export const getDefaultUserFormValues = (): UserFormData => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'USER',
  scope: 'ALL',
  isActive: true,
  middleName: '',
  phone: '',
  avatar: '',
});

// Схема для API (отдельная)
export const userCreateSchema = z.object({
  firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  role: z.enum(['ADMIN', 'USER']),
  projectId: z.number(),
  scope: z.enum(['ALL', 'SPECIFIC_GROUPS']).optional().default('ALL'),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  visibleGroups: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
