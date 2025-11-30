// src/components/forms/GroupForm.tsx

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select } from '@/components/ui';

// Создаем простой Textarea компонент прямо здесь
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          placeholder-gray-400
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

const groupSchema = z.object({
  name: z.string().min(2, 'Название группы должно быть не менее 2 символов'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Проект обязателен'),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface GroupFormProps {
  onSubmit: (data: GroupFormData) => void;
  loading?: boolean;
  initialData?: Partial<GroupFormData>;
  projects: { id: number; name: string }[];
}

export function GroupForm({ onSubmit, loading = false, initialData, projects }: GroupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: initialData,
  });

  const projectOptions = projects.map((project) => ({
    value: project.id.toString(),
    label: project.name,
  }));

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {initialData ? 'Редактирование группы' : 'Создание группы'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Название группы *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Введите название группы"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Описание группы (необязательно)"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <Select
          label="Проект *"
          {...register('projectId')}
          options={projectOptions}
          error={errors.projectId?.message}
        />

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : initialData ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
