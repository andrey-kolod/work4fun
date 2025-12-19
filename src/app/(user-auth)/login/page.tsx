// // ФАЙЛ: src/app/(user-auth)/login/page.tsx
// // НАЗНАЧЕНИЕ: Страница входа в систему (/login)

// 'use client';

// import { useState, useRef } from 'react';
// import { signIn } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import Link from 'next/link';
// import { Eye, EyeOff } from 'lucide-react';
// import ReCAPTCHA from 'react-google-recaptcha';
// import { loginSchema } from '@/lib/validations/auth';
// import type { LoginInput } from '@/lib/validations/auth';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Label } from '@/components/ui/Label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
// import { Checkbox } from '@/components/ui/Checkbox';

// export default function LoginPage() {
//   const router = useRouter();
//   const recaptchaRef = useRef<ReCAPTCHA>(null);

//   const [isLoading, setIsLoading] = useState(false);
//   const [serverError, setServerError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginInput>({
//     resolver: zodResolver(loginSchema),
//   });

//   const onSubmit = async (data: LoginInput) => {
//     console.log('🔐 Попытка входа:', data.email);

//     setIsLoading(true);
//     setServerError('');

//     try {
//       const recaptchaToken = await recaptchaRef.current?.executeAsync();
//       recaptchaRef.current?.reset();

//       if (!recaptchaToken) {
//         setServerError('Не удалось пройти проверку reCAPTCHA');
//         setIsLoading(false);
//         return;
//       }

//       const verifyRes = await fetch('/api/auth/recaptcha', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token: recaptchaToken }),
//       });

//       const verifyData = await verifyRes.json();

//       if (!verifyData.success || verifyData.score < 0.5) {
//         console.warn('reCAPTCHA: подозрительный пользователь, score:', verifyData.score);
//         setServerError('Проверка не пройдена. Попробуйте позже.');
//         setIsLoading(false);
//         return;
//       }

//       const result = await signIn('credentials', {
//         email: data.email,
//         password: data.password,
//         redirect: false,
//       });

//       if (result?.error) {
//         console.error('❌ Ошибка входа:', result.error);
//         setServerError('Неверный email или пароль. Попробуйте снова.');
//       } else if (result?.ok) {
//         console.log('✅ Успешный вход!');
//         router.push('/projects');
//         router.refresh();
//       }
//     } catch (error) {
//       console.error('Ошибка при проверке reCAPTCHA:', error);
//       setServerError('Произошла ошибка. Попробуйте позже.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md mx-auto">
//       <Card>
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl">Вход в систему</CardTitle>
//           <p className="text-text-secondary">Введите email и пароль</p>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {serverError && (
//               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
//                 {serverError}
//               </div>
//             )}

//             {/* Электронная почта */}
//             <div className="space-y-2">
//               <Label htmlFor="email">Электронная почта</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="your@email.com"
//                 {...register('email')}
//                 error={errors.email?.message}
//                 disabled={isLoading}
//               />
//             </div>

//             {/* Пароль */}
//             <div className="space-y-2">
//               <Label htmlFor="password">Пароль</Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? 'text' : 'password'}
//                   placeholder="••••••••"
//                   {...register('password')}
//                   error={errors.password?.message}
//                   disabled={isLoading}
//                   value={'demo123'}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             {/* Запомнить меня */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center space-x-2 cursor-pointer">
//                 <Checkbox
//                   checked={rememberMe}
//                   onCheckedChange={(checked) => setRememberMe(checked as boolean)}
//                   disabled={isLoading}
//                 />
//                 <span className="text-sm">Запомнить меня</span>
//               </label>

//               {/* Забыли пароль */}
//               <Link href="/password/reset" className="text-sm text-primary hover:underline">
//                 Забыли пароль?
//               </Link>
//             </div>

//             {/* reCAPTCHA */}
//             <ReCAPTCHA
//               sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
//               size="invisible"
//               ref={recaptchaRef}
//             />

//             <div className="flex justify-center pt-4">
//               <Button type="submit" className="px-12" loading={isLoading}>
//                 Войти
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// ФАЙЛ: src/app/(user-auth)/login/page.tsx
// НАЗНАЧЕНИЕ: Страница входа в систему (/login)
// Добавлена удобная подсказка с демо-аккаунтами для быстрого тестирования

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

export default function LoginPage() {
  // Хук для навигации после успешного входа
  const router = useRouter();

  // Ссылка на невидимую reCAPTCHA
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Состояния компонента
  const [isLoading, setIsLoading] = useState(false); // Показ кнопки загрузки
  const [serverError, setServerError] = useState(''); // Ошибка от сервера
  const [showPassword, setShowPassword] = useState(false); // Показать/скрыть пароль
  const [rememberMe, setRememberMe] = useState(false); // Чекбокс "Запомнить меня"
  const [copiedEmail, setCopiedEmail] = useState(''); // Какой email только что скопировали

  // Форма с валидацией через react-hook-form + zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Функция копирования email в буфер обмена
  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(''), 2000); // Сообщение исчезает через 2 секунды
  };

  // Обработчик отправки формы
  const onSubmit = async (data: LoginInput) => {
    console.log('🔐 Попытка входа:', data.email);

    setIsLoading(true);
    setServerError('');

    try {
      // Выполняем невидимую reCAPTCHA
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();

      if (!recaptchaToken) {
        setServerError('Не удалось пройти проверку reCAPTCHA');
        setIsLoading(false);
        return;
      }

      // Проверяем токен на сервере
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

      // Выполняем вход через NextAuth
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
        router.push('/projects'); // Переходим на страницу выбора проекта
        router.refresh(); // Обновляем серверные данные
      }
    } catch (error) {
      console.error('Ошибка при проверке reCAPTCHA:', error);
      setServerError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Подсказка с демо-аккаунтами — только для разработки */}
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
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-one@w4f.com — Владелец 1 проекта</span>
            <button
              onClick={() => copyToClipboard('owner-one@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-three@w4f.com — Владелец 3 проектов</span>
            <button
              onClick={() => copyToClipboard('owner-three@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>owner-zero@w4f.com — Может создать проект (0/3)</span>
            <button
              onClick={() => copyToClipboard('owner-zero@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-zero@w4f.com — Пользователь без проектов</span>
            <button
              onClick={() => copyToClipboard('member-zero@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-one@w4f.com — Участник в 1 проекте</span>
            <button
              onClick={() => copyToClipboard('member-one@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span>member-three@w4f.com — Участник в 3 проектах</span>
            <button
              onClick={() => copyToClipboard('member-three@w4f.com')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition"
            >
              <Copy size={16} />
            </button>
          </li>
        </ul>
        {copiedEmail && (
          <p className="text-green-600 text-xs mt-3 animate-pulse">
            ✓ {copiedEmail} скопирован в буфер обмена!
          </p>
        )}
      </div>

      {/* Основная форма входа */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <p className="text-text-secondary">Введите email и пароль</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Сообщение об ошибке от сервера */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
                {serverError}
              </div>
            )}

            {/* Поле электронной почты */}
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

            {/* Поле пароля */}
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
                  // Для удобства тестирования подставляем пароль из демо-данных
                  value={'demo123'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Чекбокс "Запомнить меня" и ссылка на восстановление пароля */}
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

            {/* Невидимая reCAPTCHA */}
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              size="invisible"
              ref={recaptchaRef}
            />

            {/* Кнопка входа */}
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
