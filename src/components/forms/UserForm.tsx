// // Указываем что этот компонент выполняется на клиенте (в браузере)
// 'use client';

// // Импортируем необходимые библиотеки и компоненты
// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { userCreateSchema, UserCreateData } from '@/schemas/user';
// import { Input } from '@/components/ui/Input';
// import { Button } from '@/components/ui/Button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// interface UserFormProps {
//   onSubmit: (data: UserCreateData) => void;
//   loading?: boolean;
//   initialData?: Partial<UserCreateData>;
// }

// export function UserForm({ onSubmit, loading = false, initialData }: UserFormProps) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<UserCreateData>({
//     resolver: zodResolver(userCreateSchema),
//     defaultValues: initialData,
//   });

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>{initialData ? 'Редактировать пользователя' : 'Создать пользователя'}</CardTitle>
//       </CardHeader>

//       <CardContent>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Input label="Имя" {...register('firstName')} error={errors.firstName?.message} />

//             <Input label="Фамилия" {...register('lastName')} error={errors.lastName?.message} />
//           </div>

//           <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />

//           {!initialData && (
//             <Input
//               label="Пароль"
//               type="password"
//               {...register('password')}
//               error={errors.password?.message}
//             />
//           )}

//           <div className="flex justify-end space-x-2 pt-4">
//             <Button type="button" variant="ghost">
//               Отмена
//             </Button>

//             <Button type="submit" loading={loading}>
//               {initialData ? 'Обновить' : 'Создать'}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userCreateSchema, UserCreateData } from '@/schemas/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface UserFormProps {
  onSubmit: (data: UserCreateData) => void;
  loading?: boolean;
  initialData?: Partial<UserCreateData>;
  onCancel?: () => void; // 👈 ДОБАВИЛИ onCancel
}

export function UserForm({ onSubmit, loading = false, initialData, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCreateData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: initialData,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Редактировать пользователя' : 'Создать пользователя'}</CardTitle>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
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
