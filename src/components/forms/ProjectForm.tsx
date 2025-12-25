// src/components/forms/ProjectForm.tsx
// [ИСПРАВЛЕНО] Добавлен пропс redirectPath и улучшена логика навигации

'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// Схема строго по PRD 3.2.1
const projectSchema = z.object({
  name: z
    .string()
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(100, 'Название слишком длинное (максимум 100 символов)'),
  description: z.string().max(500, 'Описание не должно превышать 500 символов').optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// [ИСПРАВЛЕНИЕ] Добавляем интерфейс для пропсов
interface ProjectFormProps {
  redirectPath?: string; // Куда перенаправлять после успешного создания
  showCancelButton?: boolean; // Показывать ли кнопку "Отмена"
  onSuccess?: (projectId: string) => void; // Коллбэк при успешном создании
  onCancel?: () => void; // Коллбэк при отмене
}

export function ProjectForm({
  redirectPath = '/projects', // [ИСПРАВЛЕНИЕ] Значение по умолчанию
  showCancelButton = true,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: undefined,
    },
  });

  const onSubmit: SubmitHandler<ProjectFormData> = async (data) => {
    setLoading(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ [ProjectForm] Начало создания проекта');
      console.log('📤 [ProjectForm] Данные формы:', data);
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description ? data.description.trim() : undefined,
        }),
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = { error: `Ошибка сервера ${response.status}` };
        }

        // [ИСПРАВЛЕНИЕ] Обработка специфичных ошибок
        if (
          errData.error?.includes('Превышен лимит') ||
          errData.error?.includes('Лимит проектов')
        ) {
          addToast({
            type: 'error',
            title: 'Лимит проектов',
            description:
              errData.error ||
              'Достигнут лимит в 3 проекта. Чтобы создать новый, передайте владение одним из существующих проектов.',
          });

          // Если достигнут лимит, перенаправляем на страницу проектов
          if (errData.details?.includes('лимит')) {
            setTimeout(() => {
              router.push('/projects');
            }, 2000);
          }
          return;
        }

        throw new Error(errData.error || errData.details || 'Ошибка создания проекта');
      }

      const result = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [ProjectForm] Проект успешно создан:', result);
        console.log(`📊 [ProjectForm] ID проекта: ${result.project?.id}`);
        console.log(`📍 [ProjectForm] Перенаправление на: ${redirectPath}`);
      }

      addToast({
        type: 'success',
        title: 'Проект создан!',
        description: `Проект "${result.project?.name || 'Новый проект'}" успешно создан.`,
      });

      reset();

      // [ИСПРАВЛЕНИЕ] Вызываем коллбэк или выполняем навигацию
      if (onSuccess && result.project?.id) {
        onSuccess(result.project.id);
      } else {
        // Варианты навигации в зависимости от redirectPath
        if (redirectPath === '/projects') {
          // Просто перенаправляем на страницу проектов
          router.push('/projects');
        } else if (redirectPath === '/tasks') {
          // Перенаправляем на задачи с projectId
          if (result.project?.id) {
            router.push(`/tasks?projectId=${result.project.id}`);
          } else {
            router.push('/projects');
          }
        } else {
          // Кастомный путь
          router.push(redirectPath);
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error('💥 [ProjectForm] Ошибка:', error);

      // [ИСПРАВЛЕНИЕ] Более информативные сообщения об ошибках
      let errorMessage = 'Не удалось создать проект. Попробуйте позже.';

      if (error.message.includes('Название проекта обязательно')) {
        errorMessage = 'Название проекта обязательно. Введите название проекта.';
      } else if (
        error.message.includes('Превышен лимит') ||
        error.message.includes('Лимит проектов')
      ) {
        errorMessage =
          'Достигнут лимит в 3 проекта. Чтобы создать новый, передайте владение одним из существующих проектов.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        type: 'error',
        title: 'Ошибка создания',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          label="Название проекта *"
          placeholder="Например: Wildberries 2025"
          {...register('name')}
          error={errors.name?.message}
          disabled={loading}
          required
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-500">Минимум 3 символа, максимум 100 символов</p>
      </div>

      <div>
        <Textarea
          label="Описание проекта"
          placeholder="Краткое описание проекта..."
          rows={4}
          {...register('description')}
          error={errors.description?.message}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">Необязательное поле, максимум 500 символов</p>
      </div>

      {/* [ИСПРАВЛЕНИЕ] Информация для разработки */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Отладка:</strong> После создания перенаправление на: <code>{redirectPath}</code>
          </p>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-6">
        {showCancelButton && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Отмена
          </Button>
        )}

        <Button
          type="submit"
          loading={loading || isSubmitting}
          disabled={loading || isSubmitting}
          className="min-w-[120px]"
        >
          {loading ? 'Создаём...' : 'Создать проект'}
        </Button>
      </div>
    </form>
  );
}
