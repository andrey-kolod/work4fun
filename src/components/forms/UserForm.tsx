// work4fun/src/components/forms/UserForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select } from '@/components/ui';
import {
  userFormSchema,
  UserFormData,
  getDefaultUserFormValues,
  UserFormDataWithGroups,
} from '@/schemas/user';

interface UserFormProps {
  onSubmit: (data: UserFormDataWithGroups) => Promise<void> | void;
  loading?: boolean;
  initialData?: Partial<UserFormDataWithGroups>;
  currentProjectId?: string;
  currentProjectName?: string;
}

interface Group {
  id: string;
  name: string;
}

export function UserForm({
  onSubmit,
  loading = false,
  initialData,
  currentProjectId,
  currentProjectName = 'Текущий проект',
}: UserFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [scope, setScope] = useState<'ALL' | 'SPECIFIC_GROUPS'>('ALL');
  const [formError, setFormError] = useState<string>('');

  // Создаем дефолтные значения
  const defaultValues = getDefaultUserFormValues();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData,
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: initialData?.password || '',
      role: initialData?.role || 'USER',
      scope: initialData?.scope || 'ALL',
      isActive: initialData?.isActive ?? true,
      middleName: initialData?.middleName || '',
      phone: initialData?.phone || '',
      avatar: initialData?.avatar || '',
    },
    mode: 'onChange',
  });

  // Следим за изменением полей
  const watchScope = watch('scope');
  const watchEmail = watch('email');
  const watchPassword = watch('password');
  const watchFirstName = watch('firstName');
  const watchLastName = watch('lastName');

  // Инициализация формы
  useEffect(() => {
    if (initialData?.scope) {
      setScope(initialData.scope);
    }
    if (initialData?.visibleGroups) {
      setSelectedGroups(initialData.visibleGroups);
    }

    // Если есть проект и scope = SPECIFIC_GROUPS, загружаем группы
    if (currentProjectId && scope === 'SPECIFIC_GROUPS') {
      fetchGroups(currentProjectId);
    }
  }, [initialData, currentProjectId, scope]);

  const fetchGroups = async (projectId: string) => {
    try {
      const response = await fetch(`/api/groups?projectId=${projectId}&pageSize=100`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    }
  };

  const handleScopeChange = (value: 'ALL' | 'SPECIFIC_GROUPS') => {
    setScope(value);
    setValue('scope', value, { shouldValidate: true });
    setFormError('');

    if (value === 'ALL') {
      setSelectedGroups([]);
    } else if (currentProjectId) {
      fetchGroups(currentProjectId);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelectedGroups = selectedGroups.includes(groupId)
      ? selectedGroups.filter((id) => id !== groupId)
      : [...selectedGroups, groupId];

    setSelectedGroups(newSelectedGroups);
    setFormError('');
  };

  const handleSelectAllGroups = () => {
    const allGroupIds = groups.map((g) => g.id);
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(allGroupIds);
    }
    setFormError('');
  };

  const handleFormSubmit: SubmitHandler<UserFormData> = (data) => {
    console.log('=== КНОПКА "СОЗДАТЬ" НАЖАТА ===');
    console.log('Данные формы:', data);
    console.log('Scope:', scope);
    console.log('Selected groups:', selectedGroups);

    setFormError('');

    // Проверка проекта
    if (!currentProjectId) {
      setFormError('Не удалось определить текущий проект');
      return;
    }

    // Проверка групп для специфического доступа
    if (scope === 'SPECIFIC_GROUPS' && selectedGroups.length === 0) {
      setFormError('Выберите хотя бы одну группу для доступа пользователя');
      return;
    }

    // Проверка пароля для нового пользователя
    const isNewUser = !initialData?.email;
    if (isNewUser && (!data.password || data.password.length < 6)) {
      setFormError('Пароль обязателен для нового пользователя (минимум 6 символов)');
      return;
    }

    console.log('✅ Все проверки пройдены, отправляем данные');

    // Собираем все данные вместе
    const formData: UserFormDataWithGroups = {
      ...data,
      visibleGroups: scope === 'SPECIFIC_GROUPS' ? selectedGroups : [],
    };

    onSubmit(formData);
  };

  const roleOptions = [
    { value: 'USER', label: 'Пользователь' },
    { value: 'ADMIN', label: 'Администратор проекта' },
  ];

  const isNewUser = !initialData?.email;
  const hasCurrentProject = !!currentProjectId;
  const hasEmail = !!watchEmail && !errors.email;
  const hasFirstName = !!watchFirstName && !errors.firstName;
  const hasLastName = !!watchLastName && !errors.lastName;
  const hasPassword = !isNewUser || (watchPassword?.length || 0) >= 6;
  const hasGroups = scope === 'ALL' || selectedGroups.length > 0;

  // Форма готова если все базовые условия выполнены
  const isFormReady =
    isValid &&
    hasCurrentProject &&
    hasEmail &&
    hasFirstName &&
    hasLastName &&
    hasPassword &&
    hasGroups;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.email ? 'Редактирование пользователя' : 'Создание пользователя'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">❌ {formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
          {/* Информация о проекте */}
          {currentProjectId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Пользователь будет добавлен в проект:{' '}
                    <span className="text-blue-600">{currentProjectName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Для добавления в другой проект перейдите в нужный проект
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Личная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Личная информация</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input label="Имя *" {...register('firstName')} error={errors.firstName?.message} />
              </div>
              <div>
                <Input
                  label="Фамилия *"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>
              <div>
                <Input
                  label="Отчество"
                  {...register('middleName')}
                  error={errors.middleName?.message}
                  placeholder="Необязательно"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Email *"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
              <div>
                <Input
                  label="Телефон"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="+7 (999) 999-99-99 (необязательно)"
                />
              </div>
            </div>

            {/* Аватар */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Аватар (URL) - необязательно
              </label>
              <Input
                {...register('avatar')}
                error={errors.avatar?.message}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Пароль */}
            {isNewUser && (
              <div>
                <Input
                  label="Пароль *"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Минимум 6 символов"
                />
              </div>
            )}
          </div>

          {/* Права доступа */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Права доступа в проекте</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Роль в проекте *"
                  {...register('role')}
                  options={roleOptions}
                  error={errors.role?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Активность</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm cursor-pointer">
                    Активный пользователь
                  </label>
                </div>
                {errors.isActive && (
                  <p className="text-red-500 text-sm mt-1">{errors.isActive.message}</p>
                )}
              </div>
            </div>

            {/* Область видимости */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Область видимости *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="ALL"
                      checked={scope === 'ALL'}
                      onChange={() => handleScopeChange('ALL')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      disabled={!hasCurrentProject}
                    />
                    <span className="text-sm">Весь проект</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="SPECIFIC_GROUPS"
                      checked={scope === 'SPECIFIC_GROUPS'}
                      onChange={() => handleScopeChange('SPECIFIC_GROUPS')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      disabled={!hasCurrentProject}
                    />
                    <span className="text-sm">Определенные группы</span>
                  </label>
                </div>
                {errors.scope && (
                  <p className="text-red-500 text-sm mt-1">{errors.scope.message}</p>
                )}
              </div>

              {/* Выбор групп */}
              {hasCurrentProject && scope === 'SPECIFIC_GROUPS' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Выберите доступные группы *
                      <span className="text-gray-500 text-sm ml-2">
                        ({selectedGroups.length} выбрано)
                      </span>
                    </label>
                    {groups.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllGroups}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {selectedGroups.length === groups.length ? 'Снять все' : 'Выбрать все'}
                      </button>
                    )}
                  </div>

                  {groups.length > 0 ? (
                    <div className="border rounded-md p-3 max-h-60 overflow-y-auto bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {groups.map((group) => (
                          <label
                            key={group.id}
                            className="flex items-center space-x-2 py-1 hover:bg-gray-100 px-2 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm truncate">{group.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm text-yellow-700">
                        В проекте нет групп. Выберите "Весь проект" или создайте группы.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.history.back()}
              disabled={loading}
            >
              Отмена
            </Button>

            {/* Основная кнопка */}
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !isFormReady}
              title={!isFormReady ? 'Заполните все обязательные поля' : 'Создать пользователя'}
            >
              {initialData?.email ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
