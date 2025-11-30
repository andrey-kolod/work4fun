// src/components/forms/UserForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select } from '@/components/ui';

const userSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  loading?: boolean;
  initialData?: Partial<UserFormData>;
}

export function UserForm({ onSubmit, loading = false, initialData }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  const roleOptions = [
    { value: 'USER', label: 'Пользователь' },
    { value: 'ADMIN', label: 'Администратор' },
    { value: 'SUPER_ADMIN', label: 'Супер-администратор' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Редактирование пользователя' : 'Создание пользователя'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Имя" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Фамилия" {...register('lastName')} error={errors.lastName?.message} />
          </div>

          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />

          {!initialData && (
            <Input
              label="Пароль"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
          )}

          <Select
            label="Роль"
            {...register('role')}
            options={roleOptions}
            error={errors.role?.message}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>
              Отмена
            </Button>
            <Button type="submit" loading={loading}>
              {initialData ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
