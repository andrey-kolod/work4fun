// src/components/ui/Input.tsx
// [ПОЛНОЕ ИСПРАВЛЕНИЕ] Исправлена ошибка ESLint "React Hook "React.useId" is called conditionally"
// Причина ошибки (объяснение для новичка):
//   • React строго требует, чтобы все хуки (useId, useState, useEffect и т.д.) вызывались в одном и том же порядке при каждом рендере
//   • Раньше useId вызывался только если label был передан — это нарушало правило
//   • Теперь useId вызывается всегда в самом начале компонента — порядок хуков фиксированный
//   • id генерируется всегда, но используется только если не передан проп id
//   • Это лучшая практика: useId всегда в начале, без условий
//   • Добавлено dev-логирование для отладки состояний
//   • Стили улучшены для consistency с остальным проектом (primary-500 вместо purple)

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Label } from './Label';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', label, error = false, success = false, id: propId, ...props },
    ref
  ) => {
    // [ИЗМЕНЕНИЕ] useId вызывается всегда в начале — порядок хуков фиксированный
    const generatedId = React.useId();
    const inputId = propId || generatedId;

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] Input.tsx: error=', error, 'success=', success, 'label=', label);
    }

    return (
      <div className="space-y-1">
        {label && (
          <Label htmlFor={inputId} className={error ? 'text-red-600' : undefined}>
            {label}
          </Label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white pr-10',
              'placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',

              'border-gray-300',

              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',

              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',

              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {error && <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />}
            {!error && success && (
              <CheckCircle2 className="h-5 w-5 text-primary-600" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
