// src/components/ui/FormTextarea.tsx
'use client';

import React from 'react';
import { Textarea } from './Textarea';

// [НОВЫЙ ФАЙЛ] Компонент для textarea с фокусом (для анимации подсказки в форме)
interface FormTextareaProps {
  /** Имя/id поля */
  id: string;
  /** Placeholder */
  placeholder: string;
  /** Количество строк */
  rows?: number;
  /** Флаг ошибки */
  hasError: boolean;
  /** Любые другие пропсы (register, disabled) */
  [key: string]: any;
}

export function FormTextarea({
  id,
  placeholder,
  rows = 4,
  hasError,
  ...restProps
}: FormTextareaProps) {
  // [НОВОЕ] Состояние фокуса для передачи в форму (анимация подсказки)
  const [isFocused, setIsFocused] = React.useState(false);

  // [ЛОГ ДЛЯ DEV]
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] FormTextarea: ${id} | focused=`, isFocused, '| error=', hasError);
  }

  return (
    <div className="space-y-1">
      <Textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        error={hasError}
        success={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...restProps}
      />
      {/* Подсказка не здесь — она ручная в форме (для счётчика и текста) */}
    </div>
  );
}
