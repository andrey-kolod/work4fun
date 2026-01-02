// /src/schemas/group.ts

import { z } from 'zod';

export const groupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Название группы должно содержать минимум 2 символа')
    .max(50, 'Название группы слишком длинное'),
  projectId: z.string().min(1, 'Выберите проект'),
  description: z.string().trim().max(200, 'Описание не должно превышать 200 символов').optional(),
});

export type GroupFormData = z.infer<typeof groupFormSchema>;
