// src/app/(user-auth)/login/page.tsx

'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Copy } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { loginSchema } from '@/lib/validations/auth';
import type { LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { fetchJson } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  if (process.env.NODE_ENV === 'development') {
    if (Object.keys(errors).length > 0) {
      console.log('🚨 [LoginPage] Ошибки валидации формы:', errors);
    }
  }

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(''), 2000);
  };

  const onSubmit = async (data: LoginInput) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [LoginPage] Попытка входа:', data.email, { rememberMe });
    }

    setIsLoading(true);
    setServerError('');

    try {
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();

      if (!recaptchaToken) {
        setServerError('Не удалось пройти проверку reCAPTCHA');
        if (process.env.NODE_ENV === 'development') {
          console.warn('reCAPTCHA: токен не получен');
        }
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [LoginPage] Отправка токена на серверную проверку reCAPTCHA');
      }

      const {
        data: verifyData,
        error: recaptchaError,
        status: recaptchaStatus,
      } = await fetchJson<{
        success: boolean;
        score?: number;
      }>('/api/auth/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      if (recaptchaError || !verifyData?.success || (verifyData.score ?? 0) < 0.5) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `reCAPTCHA не пройдена: success=${verifyData?.success}, score=${verifyData?.score}, status=${recaptchaStatus}`
          );
        }
        setServerError('Проверка reCAPTCHA не пройдена. Попробуйте позже.');
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [LoginPage] reCAPTCHA пройдена, score: ${verifyData.score}`);
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        rememberMe: rememberMe ? 'on' : undefined,
        redirect: false,
      });

      if (result?.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [LoginPage] Ошибка входа:', result.error);
        }
        setServerError('Неверный email или пароль. Попробуйте снова.');
      } else if (result?.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [LoginPage] Успешный вход! Сессия: ${rememberMe ? '30 дней' : '1 день'}`);
        }

        router.push('/projects?fromLogin=true');
        router.refresh();
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('💥 [LoginPage] Неожиданная ошибка при входе:', error);
      }
      setServerError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Демо-аккаунты */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-blue-900 mb-3">
          🔑 Демо-аккаунты (пароль для всех:{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">demo123</code>)
        </p>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-center justify-between">
            <span>superadmin@w4f.com — Супер-админ</span>
            <button
              onClick={() => copyToClipboard('superadmin@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              title="Скопировать email"
              aria-label="Скопировать email superadmin@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-one@w4f.com — Владелец 1 проекта</span>
            <button
              onClick={() => copyToClipboard('owner-one@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email owner-one@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-three@w4f.com — Владелец 3 проектов</span>
            <button
              onClick={() => copyToClipboard('owner-three@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email owner-three@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-zero@w4f.com — Может создать проект (0/3)</span>
            <button
              onClick={() => copyToClipboard('owner-zero@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email owner-zero@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-zero@w4f.com — Пользователь без проектов</span>
            <button
              onClick={() => copyToClipboard('member-zero@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email member-zero@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-one@w4f.com — Участник в 1 проекте</span>
            <button
              onClick={() => copyToClipboard('member-one@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email member-one@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-three@w4f.com — Участник в 3 проектах</span>
            <button
              onClick={() => copyToClipboard('member-three@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
              aria-label="Скопировать email member-three@w4f.com"
            >
              <Copy size={16} />
            </button>
          </li>
        </ul>
        {copiedEmail && (
          <p className="text-green-600 text-xs mt-3 animate-pulse">✓ {copiedEmail} скопирован!</p>
        )}
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <p className="text-text-secondary">Введите email и пароль</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
                {serverError}
              </div>
            )}

            {/* Поле Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                error={!!errors.email}
                disabled={isLoading}
                aria-label="Введите email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Поле Пароль */}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={!!errors.password}
                  disabled={isLoading}
                  value={'demo123'}
                  aria-label="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* [НОВОЕ] Чекбокс "Запомнить меня" теперь реально работает */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  aria-label="Запомнить меня"
                />
                <span className="text-sm">Запомнить меня</span>
              </label>

              <Link
                href="/password/reset"
                className="text-sm text-primary hover:underline"
                aria-label="Забыли пароль?"
              >
                Забыли пароль?
              </Link>
            </div>

            {/* reCAPTCHA (invisible) */}
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              size="invisible"
              ref={recaptchaRef}
            />

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                className="px-12"
                loading={isLoading}
                aria-label="Войти в систему"
              >
                Войти
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
