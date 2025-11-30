// src/components/forms/ProjectForm.tsx

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Textarea } from '@/components/ui';

const projectSchema = z.object({
  name: z.string().min(2, 'Название проекта должно быть не менее 2 символов'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  loading?: boolean;
  initialData?: Partial<ProjectFormData>;
  users: { id: number; firstName: string; lastName: string; email: string }[];
}

export function ProjectForm({ onSubmit, loading = false, initialData, users }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'ACTIVE',
      ...initialData,
    },
  });

  const statusOptions = [
    { value: 'ACTIVE', label: 'Активен' },
    { value: 'COMPLETED', label: 'Завершен' },
    { value: 'ARCHIVED', label: 'Архивирован' },
  ];

  const userOptions = users.map((user) => ({
    value: user.id.toString(),
    label: `${user.firstName} ${user.lastName} (${user.email})`,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input label="Название проекта" {...register('name')} error={errors.name?.message} />

        <Textarea
          label="Описание"
          {...register('description')}
          error={errors.description?.message}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Дата начала"
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
          />

          <Input
            label="Дата завершения"
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
          />
        </div>

        <Select
          label="Статус"
          {...register('status')}
          options={statusOptions}
          error={errors.status?.message}
        />

        {initialData && (
          <Select
            label="Владелец проекта"
            {...register('ownerId')}
            options={userOptions}
            error={errors.ownerId?.message}
          />
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => window.history.back()}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Загрузка...' : initialData ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
