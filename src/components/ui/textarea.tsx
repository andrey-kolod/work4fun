// src/components/ui/Textarea.tsx
// [ПОЛНОЕ ИСПРАВЛЕНИЕ] Исправлена ошибка ESLint "React Hook "React.useId" is called conditionally"
// Причина та же, что и в Input.tsx:
//   • useId вызывался только если label был передан — нарушал порядок хуков
//   • Теперь useId всегда в начале
//   • id генерируется всегда, но используется только если не передан проп id
//   • Добавлено dev-логирование для отладки

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Label } from './Label';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error = false, success = false, className = '', id: propId, ...props }, ref) => {
    // [ИЗМЕНЕНИЕ] useId всегда в начале — порядок хуков фиксированный
    const generatedId = React.useId();
    const textareaId = propId || generatedId;

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] Textarea.tsx: error=', error, 'success=', success, 'label=', label);
    }

    return (
      <div className="w-full space-y-1">
        {label && (
          <Label htmlFor={textareaId} className={error ? 'text-red-600' : undefined}>
            {label}
          </Label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(
              'w-full px-3 py-2 border rounded-md text-sm pr-10 min-h-[100px]',
              'placeholder:text-gray-500',
              'transition-all duration-200',

              'border-gray-300',

              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',

              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',

              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute top-2 right-0 flex items-start pr-3 pointer-events-none">
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

Textarea.displayName = 'Textarea';
export { Textarea };
