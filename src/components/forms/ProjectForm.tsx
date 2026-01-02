// src/components/forms/ProjectForm.tsx

'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

import { projectFormSchema, ProjectFormData, getDefaultProjectFormValues } from '@/schemas/project';
import { fetchJson } from '@/lib/api-client';

interface ProjectFormProps {
  redirectPath?: string;
  showCancelButton?: boolean;
  onSuccess?: (projectId: string) => void;
  onCancel?: () => void;
}

export function ProjectForm({
  redirectPath = '/projects',
  showCancelButton = true,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    mode: 'onChange',
    defaultValues: getDefaultProjectFormValues(),
  });

  const nameValue = watch('name');
  const descriptionValue = watch('description') ?? '';
  const nameLength = nameValue?.length || 0;
  const descriptionLength = descriptionValue.length;

  const isNameValid = nameLength >= 3 && nameLength <= 100 && !errors.name;
  const hasNameError = !!errors.name;

  const shouldNameLabelBeRed = !isNameValid;

  const showNameHint = isNameFocused || hasNameError;
  const showDescriptionHint = isDescriptionFocused || !!errors.description;

  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] ProjectForm: isValid=', isValid);
    console.log('[DEV] ProjectForm: isNameValid=', isNameValid);
    console.log('[DEV] ProjectForm: errors=', errors);
    console.log(
      '[DEV] ProjectForm: name focused=',
      isNameFocused,
      'description focused=',
      isDescriptionFocused
    );
  }

  const onSubmit: SubmitHandler<ProjectFormData> = async (data) => {
    setLoading(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 [ProjectForm] Отправка данных создания проекта:', data);
    }

    try {
      const {
        data: result,
        error,
        status,
      } = await fetchJson<{ project: { id: string; name: string } }>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
        }),
      });

      if (error) {
        const errorMessage =
          status === 403
            ? 'Достигнут лимит в 3 проекта. Передайте владение одним из существующих.'
            : error || 'Неизвестная ошибка сервера';

        if (process.env.NODE_ENV === 'development') {
          console.error(`🚨 [ProjectForm] Ошибка создания проекта (status ${status}):`, error);
        }

        addToast({
          type: 'error',
          title: 'Не удалось создать проект',
          description: errorMessage,
        });
        return;
      }

      if (!result?.project) {
        throw new Error('Сервер не вернул данные проекта');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [ProjectForm] Проект успешно создан:', result.project);
      }

      addToast({
        type: 'success',
        title: 'Проект создан!',
        description: `Проект "${result.project.name}" успешно создан.`,
      });

      if (onSuccess && result.project.id) {
        onSuccess(result.project.id);
        setLoading(false);
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch (unexpectedError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('💥 [ProjectForm] Неожиданная ошибка при создании проекта:', unexpectedError);
      }

      addToast({
        type: 'error',
        title: 'Ошибка',
        description: unexpectedError.message || 'Не удалось создать проект. Попробуйте позже.',
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

  const getNameMessage = () => {
    return errors.name?.message || 'Минимум 3 символа, максимум 100 символов';
  };

  const getNameMessageColor = () => (hasNameError ? 'text-red-600' : 'text-gray-500');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Название проекта */}
      <div className="space-y-1">
        <div className="flex justify-between items-center mb-2">
          <label
            className={`block text-sm font-medium ${shouldNameLabelBeRed ? 'text-red-600' : 'text-gray-700'}`}
            htmlFor="name"
          >
            Название проекта *
          </label>
        </div>

        <Input
          id="name"
          placeholder="Введите название проекта..."
          {...register('name')}
          disabled={loading}
          required
          autoFocus
          error={hasNameError}
          success={isNameValid}
          onFocus={() => setIsNameFocused(true)}
          onBlur={() => setIsNameFocused(false)}
        />

        <div className="min-h-[1.25rem]">
          <div
            className={`transition-all duration-300 ease-in-out ${
              showNameHint ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            <p className={`text-xs ${getNameMessageColor()} pt-1`}>{getNameMessage()}</p>
          </div>
        </div>
      </div>

      {/* Описание проекта */}
      <div className="space-y-1">
        <div className="flex justify-between items-center mb-2">
          <label
            className={`block text-sm font-medium ${!!errors.description ? 'text-red-600' : 'text-gray-700'}`}
            htmlFor="description"
          >
            Описание проекта
          </label>

          <div
            className={`transition-all duration-300 ease-in-out ${
              isDescriptionFocused || !!errors.description || descriptionLength > 0
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <span
              className={`text-xs ${
                descriptionLength > 500
                  ? 'text-red-600 font-semibold'
                  : descriptionLength > 450
                    ? 'text-yellow-600'
                    : 'text-gray-500'
              }`}
            >
              {descriptionLength}/500
            </span>
          </div>
        </div>

        <Textarea
          id="description"
          placeholder="Краткое описание проекта..."
          rows={4}
          {...register('description')}
          disabled={loading}
          error={!!errors.description}
          success={false}
          onFocus={() => setIsDescriptionFocused(true)}
          onBlur={() => setIsDescriptionFocused(false)}
        />

        <div className="min-h-[1.25rem]">
          <div
            className={`transition-all duration-300 ease-in-out ${
              showDescriptionHint ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            <p
              className={`text-xs ${!!errors.description ? 'text-red-600' : 'text-gray-500'} pt-1`}
            >
              Необязательное поле, максимум 500 символов
            </p>
            {descriptionLength > 500 && (
              <p className="text-xs text-red-600 font-medium pt-1">
                Превышен лимит на {descriptionLength - 500} символов
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end gap-4 pt-6">
        {showCancelButton && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          loading={loading || isSubmitting}
          disabled={loading || isSubmitting || !isValid}
          className="min-w-[120px]"
        >
          {loading ? 'Создаём...' : 'Создать проект'}
        </Button>
      </div>
    </form>
  );
}
