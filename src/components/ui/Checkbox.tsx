// ============================================================================
// ФАЙЛ: src/components/ui/Checkbox.tsx
// НАЗНАЧЕНИЕ: Компонент чекбокса (флажок) для форм
// ----------------------------------------------------------------------------
// Почему этот компонент нужен (объяснение для новичка):
// - Обычный <input type="checkbox"> выглядит по-разному в разных браузерах.
// - Мы создаём красивый, единообразный чекбокс только с галочкой (без минуса).
// - Компонент доступен (accessibility): работает с клавиатурой, screen readers.
// - Полностью типизирован для TypeScript — никаких ошибок "any".
// - При checked — фон фиолетовый + белая галочка (не белый чекбокс).
// - Когда checked = false — просто пустой квадрат с границей.
// - Теперь курсор pointer над квадратиком и текстом (когда используется с label)
// ============================================================================

import * as React from 'react';
import { cn } from '@/lib/utils'; // Утилита для объединения className (у тебя уже есть)

// Интерфейс пропсов чекбокса
// Расширяем стандартные props для <input type="checkbox">
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // checked — true = отмечен (галочка), false = пустой квадрат
  checked?: boolean;
  // onCheckedChange — удобный обработчик: когда пользователь кликает, сюда приходит true/false
  // Это лучше, чем onChange — меньше кода в форме
  onCheckedChange?: (checked: boolean) => void;
}

// forwardRef — чтобы можно было передавать ref (важно для react-hook-form)
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    // Обработчик клика по чекбоксу
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked; // true или false

      // Вызываем стандартный onChange, если кто-то его передал
      onChange?.(e);

      // Вызываем наш удобный обработчик (передаём только boolean)
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        {/* Сам чекбокс — скрытый input */}
        <input
          type="checkbox"
          ref={ref}
          checked={checked} // true = галочка, false = пусто
          onChange={handleChange}
          // data-state — нужно для красивых стилей через Tailwind
          data-state={checked ? 'checked' : 'unchecked'}
          className={cn(
            // Базовые стили: размер, скругление, граница
            'peer h-4 w-4 shrink-0 rounded-sm border-2 border-gray-300 cursor-pointer', // ДОБАВИЛИ cursor-pointer на сам квадратик
            // Когда в фокусе (Tab) — красивая обводка
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            // Отключённый — полупрозрачный
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Когда отмечен — фиолетовый фон + белая галочка
            'data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600',
            // Когда не отмечен — просто белый фон с серой границей
            'data-[state=unchecked]:bg-white data-[state=unchecked]:border-gray-300',
            className
          )}
          {...props}
        />

        {/* Белая галочка — появляется только когда checked = true */}
        {checked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg
              className="h-3 w-3 text-white" // Белая галочка
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6l3 3 5-7" /> {/* Сама галочка */}
            </svg>
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
