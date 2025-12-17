// ФАЙЛ: src/app/(user-auth)/login/page.tsx
// НАЗНАЧЕНИЕ: Страница входа в систему (/login)

'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { loginSchema } from '@/lib/validations/auth';
import type { LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    console.log('🔐 Попытка входа:', data.email);

    setIsLoading(true);
    setServerError('');

    try {
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();

      if (!recaptchaToken) {
        setServerError('Не удалось пройти проверку reCAPTCHA');
        setIsLoading(false);
        return;
      }

      const verifyRes = await fetch('/api/auth/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success || verifyData.score < 0.5) {
        console.warn('reCAPTCHA: подозрительный пользователь, score:', verifyData.score);
        setServerError('Проверка не пройдена. Попробуйте позже.');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        console.error('❌ Ошибка входа:', result.error);
        setServerError('Неверный email или пароль. Попробуйте снова.');
      } else if (result?.ok) {
        console.log('✅ Успешный вход!');
        router.push('/project-select');
        router.refresh();
      }
    } catch (error) {
      console.error('Ошибка при проверке reCAPTCHA:', error);
      setServerError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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

            {/* Электронная почта */}
            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
                value={'superadmin@w4f.com'}
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
                  value={'demo123'}
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

            {/* Запомнить меня */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <span className="text-sm">Запомнить меня</span>
              </label>

              {/* Забыли пароль */}
              <Link href="/password/reset" className="text-sm text-primary hover:underline">
                Забыли пароль?
              </Link>
            </div>

            {/* reCAPTCHA */}
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              size="invisible"
              ref={recaptchaRef}
            />

            <div className="flex justify-center pt-4">
              <Button type="submit" className="px-12" loading={isLoading}>
                Войти
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
