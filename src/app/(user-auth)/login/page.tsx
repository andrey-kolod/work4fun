// ============================================================================
// ФАЙЛ: src/app/(user-auth)/login/page.tsx
// НАЗНАЧЕНИЕ: Страница входа в систему (/login)
// ----------------------------------------------------------------------------
// Что здесь происходит (для новичка):
// 1. 'use client' — работает в браузере
// 2. react-hook-form + Zod — проверяет поля до отправки
// 3. signIn — отправляет логин/пароль на сервер
// 4. После успеха — переход на /project-select
// 5. Чекбокс "Запомнить меня", глазик для пароля, ссылка "Забыли пароль?"
// ============================================================================

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

import { loginSchema } from '@/lib/validations/auth';
import type { LoginInput } from '@/lib/validations/auth';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';

export default function LoginPage() {
  const router = useRouter();

  // Состояния компонента
  const [isLoading, setIsLoading] = useState(false); // Крутим спиннер на кнопке
  const [serverError, setServerError] = useState(''); // Ошибка от сервера
  const [showPassword, setShowPassword] = useState(false); // Показывать пароль текстом
  const [rememberMe, setRememberMe] = useState(false); // Состояние чекбокса

  // Форма с валидацией
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Отправка формы
  const onSubmit = async (data: LoginInput) => {
    console.log('Попытка входа:', data.email);

    setIsLoading(true);
    setServerError('');

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      console.error('Ошибка входа:', result.error);
      setServerError('Неверный email или пароль. Попробуйте снова.');
    } else if (result?.ok) {
      console.log('Успешный вход!');
      router.push('/project-select');
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Карточка формы */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <p className="text-text-secondary">Введите email и пароль</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ошибка сервера */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            {/* Пароль */}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Чекбокс и ссылка */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <span className="text-sm">Запомнить меня</span>
              </label>
              <Link href="/password/reset" className="text-sm text-primary hover:underline">
                Забыли пароль?
              </Link>
            </div>

            {/* Кнопка */}
            <Button type="submit" fullWidth loading={isLoading}>
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
