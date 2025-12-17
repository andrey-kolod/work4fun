// path: src/components/ui/Checkbox.tsx

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      onChange?.(e);
      onCheckedChange?.(newChecked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          data-state={checked ? 'checked' : 'unchecked'}
          className={cn(
            'appearance-none w-4 h-4 border-2 rounded cursor-pointer',
            'bg-white border-slate-300',
            checked && 'bg-[#9333ea] border-[#9333ea]',
            'hover:bg-slate-50 hover:border-slate-400',
            checked && 'hover:bg-[#a855f7] hover:border-[#a855f7]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a855f7] focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {checked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6l3 3 5-7" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
