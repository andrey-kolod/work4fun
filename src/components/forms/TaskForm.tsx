// src/components/forms/TaskForm.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { TaskFormValues, taskFormSchema } from '@/schemas/task';
import { useTaskForm } from '@/hooks/useTaskForm';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface TaskFormProps {
  initialData?: any;
  projects?: any[];
  groups?: any[];
  users?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export function TaskForm({
  initialData,
  projects,
  groups,
  users,
  onSuccess,
  onCancel,
  mode = 'create',
}: TaskFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    initialData?.assignments?.map((a: any) => a.userId?.toString()) ||
      initialData?.assigneeIds?.map((id: any) => id.toString()) ||
      []
  );

  // Создаем безопасные версии массивов
  const safeProjects = useMemo(() => projects || [], [projects]);
  const safeGroups = useMemo(() => groups || [], [groups]);
  const safeUsers = useMemo(() => users || [], [users]);

  const {
    filteredGroups,
    availableAssignees,
    filterGroupsByProject,
    filterAssignees,
    onSubmit,
    loading,
    error,
  } = useTaskForm({
    initialData,
    projects: safeProjects,
    groups: safeGroups,
    users: safeUsers,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      projectId: initialData?.projectId?.toString() || '',
      groupId: initialData?.groupId?.toString() || '',
      priority: initialData?.priority || 'MEDIUM',
      status: initialData?.status || 'TODO',
      dueDate: initialData?.dueDate || '',
      estimatedHours: initialData?.estimatedHours?.toString() || '',
      assigneeIds: [], // Будем обновлять через useEffect
      tags: initialData?.tags || [],
    },
  });

  const watchProjectId = watch('projectId');
  const watchGroupId = watch('groupId');

  // Обновляем assigneeIds в форме при изменении selectedAssignees
  useEffect(() => {
    setValue('assigneeIds', selectedAssignees);
  }, [selectedAssignees, setValue]);

  // Обновляем группы при изменении проекта
  useEffect(() => {
    if (watchProjectId) {
      filterGroupsByProject(watchProjectId);
      setValue('groupId', '');
    }
  }, [watchProjectId, setValue, filterGroupsByProject]);

  // Обновляем доступных исполнителей
  useEffect(() => {
    filterAssignees(watchProjectId, watchGroupId);
  }, [watchProjectId, watchGroupId, filterAssignees]);

  const handleFormSubmit = async (formData: TaskFormValues) => {
    try {
      // Преобразуем данные формы в формат для API
      const apiData = {
        title: formData.title,
        description: formData.description,
        projectId: parseInt(formData.projectId, 10),
        groupId: parseInt(formData.groupId, 10),
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        assigneeIds: selectedAssignees.map((id) => parseInt(id, 10)),
        tags,
      };
      const dataForHook = {
        ...formData,
        assigneeIds: selectedAssignees, // Уже массив строк
        tags,
      };

      console.log('🎯 Submitting task:', apiData);
      await onSubmit(dataForHook, mode);

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Неизвестный пользователь';
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email || 'Неизвестный пользователь';
  };

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (mode === 'edit') {
      router.back();
    } else if (mode === 'create') {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Левая колонка */}
        <div className="space-y-4">
          {/* Название задачи */}
          <div>
            <label className="block text-sm font-medium mb-1">Название задачи *</label>
            <input
              {...register('title')}
              type="text"
              placeholder="Введите название задачи"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Опишите детали задачи..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Проект и группа */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Проект *</label>
              <Select
                value={watchProjectId}
                onChange={(e) => {
                  setValue('projectId', e.target.value);
                  setValue('groupId', '');
                }}
                options={[
                  { value: '', label: 'Выберите проект' },
                  ...safeProjects.map((project: any) => ({
                    value: project.id?.toString() || '',
                    label: project.name || 'Без названия',
                  })),
                ]}
              />
              {errors.projectId && (
                <p className="text-red-500 text-sm mt-1">{errors.projectId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Группа *</label>
              <Select
                value={watchGroupId}
                onChange={(e) => setValue('groupId', e.target.value)}
                options={[
                  {
                    value: '',
                    label: !watchProjectId
                      ? 'Сначала выберите проект'
                      : filteredGroups.length === 0
                        ? 'Нет доступных групп'
                        : 'Выберите группу',
                  },
                  ...filteredGroups.map((group: any) => ({
                    value: group.id?.toString() || '',
                    label: group.name || 'Без названия',
                  })),
                ]}
                disabled={!watchProjectId || filteredGroups.length === 0}
              />
              {errors.groupId && (
                <p className="text-red-500 text-sm mt-1">{errors.groupId.message}</p>
              )}
            </div>
          </div>

          {/* Приоритет и статус */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Приоритет</label>
              <Select
                value={watch('priority')}
                onChange={(e) => setValue('priority', e.target.value as any)}
                options={[
                  { value: 'LOW', label: 'Низкий' },
                  { value: 'MEDIUM', label: 'Средний' },
                  { value: 'HIGH', label: 'Высокий' },
                  { value: 'URGENT', label: 'Срочный' },
                ]}
              />
            </div>

            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium mb-1">Статус</label>
                <Select
                  value={watch('status')}
                  onChange={(e) => setValue('status', e.target.value as any)}
                  options={[
                    { value: 'TODO', label: 'К выполнению' },
                    { value: 'IN_PROGRESS', label: 'В работе' },
                    { value: 'REVIEW', label: 'На проверке' },
                    { value: 'DONE', label: 'Завершено' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка */}
        <div className="space-y-4">
          {/* Срок выполнения */}
          <div>
            <label className="block text-sm font-medium mb-1">Срок выполнения</label>
            <input
              type="date"
              value={formatDateForInput(watch('dueDate'))}
              onChange={(e) => setValue('dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Оценка времени */}
          <div>
            <label className="block text-sm font-medium mb-1">Оценка времени (часы)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              {...register('estimatedHours')}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Исполнители */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Исполнители *</label>
              {selectedAssignees.length > 0 && (
                <span className="text-xs text-green-600">Выбрано: {selectedAssignees.length}</span>
              )}
            </div>

            {availableAssignees.length === 0 ? (
              <div className="text-center py-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-500">Нет доступных пользователей</p>
                <p className="text-xs text-gray-400 mt-1">Выберите проект и группу</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {availableAssignees.map((user: any) => {
                    const isSelected = selectedAssignees.includes(user.id.toString());
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => toggleAssignee(user.id.toString())}
                        className={`
                          flex items-center p-2 rounded text-left transition-colors
                          ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div
                          className={`
                          h-4 w-4 rounded border flex items-center justify-center mr-2
                          ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                        `}
                        >
                          {isSelected && <div className="h-2 w-2 bg-white rounded-sm" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{getUserDisplayName(user)}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Ошибка валидации */}
                {errors.assigneeIds && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 text-sm">{errors.assigneeIds.message}</p>
                  </div>
                )}

                {/* Выбранные исполнители */}
                {selectedAssignees.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedAssignees.map((userId) => {
                        const user = availableAssignees.find(
                          (u: any) => u.id.toString() === userId
                        );
                        if (!user) return null;

                        return (
                          <div
                            key={userId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {getUserDisplayName(user)}
                            <button
                              type="button"
                              onClick={() => toggleAssignee(userId)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium mb-1">Теги</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить тег..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Добавить
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="border-t pt-6">
        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Создать задачу'}
          </Button>
        </div>
      </div>
    </form>
  );
}
