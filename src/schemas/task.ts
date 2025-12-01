// src/schemas/task.ts
import { z } from 'zod';

// Схема для формы (все поля как строки)
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200, 'Слишком длинное название'),
  description: z.string().max(5000, 'Описание слишком длинное').optional(),
  projectId: z.string().min(1, 'Выберите проект'),
  groupId: z.string().min(1, 'Выберите группу'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  dueDate: z.string().optional().nullable(),
  // estimatedHours как string в форме, потом преобразуем в число
  estimatedHours: z.string().optional().nullable(),
  // assigneeIds как массив строк в форме
  assigneeIds: z
    .array(z.string())
    .refine((arr) => arr.length > 0, { message: 'Выберите хотя бы одного исполнителя' }),
  tags: z.array(z.string()).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

// Тип для преобразования данных формы в данные для API
export type TaskFormToAPIData = (data: TaskFormValues) => {
  title: string;
  description?: string;
  projectId: number;
  groupId: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string | null;
  estimatedHours?: number | null;
  assigneeIds: number[];
  tags?: string[];
};
