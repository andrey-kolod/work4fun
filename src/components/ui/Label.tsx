// ============================================================================
// ФАЙЛ: src/components/ui/Label.tsx
// НАЗНАЧЕНИЕ: Компонент для меток полей формы (<label>)
// ----------------------------------------------------------------------------
// Это стандартный компонент из shadcn/ui (библиотека UI-компонентов).
// Почему нужен: для доступности (screen readers) и стиля.
// Используем cn() из utils.ts (у тебя есть).
// ============================================================================

import * as React from 'react';
import { cn } from '@/lib/utils'; // Утилита для объединения классов (className)

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Наследуем все стандартные props label
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));

Label.displayName = 'Label';

export { Label };
