// /src/schemas/project.ts

import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(100, 'Название слишком длинное (максимум 100 символов)'),
  description: z
    .string()
    .trim()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .or(z.literal('')),
});

export const projectCreateSchema = projectFormSchema.extend({});

export const projectUpdateSchema = projectFormSchema.partial();

export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type ProjectCreateData = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateData = z.infer<typeof projectUpdateSchema>;

export const getDefaultProjectFormValues = (): ProjectFormData => ({
  name: '',
  description: '',
});

export const projectSlugSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только буквы, цифры и дефисы')
    .min(3, 'Slug должен содержать минимум 3 символа')
    .max(100, 'Slug слишком длинный'),
});
