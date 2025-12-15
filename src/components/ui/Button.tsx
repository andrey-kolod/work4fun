// components/ui/Button.tsx
import React from 'react';

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'cta'
    | 'cta-light'
    | 'register';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean; // Новый проп для одинаковой ширины
}

// components/ui/Button.tsx - исправленный
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900',
      outline:
        'border-2 border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700 shadow-sm hover:shadow',
      ghost: 'text-primary-600 hover:bg-primary-50',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      cta: 'bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 border border-white shadow-xl hover:shadow-2xl',
      'cta-light':
        'bg-white text-primary-600 hover:bg-primary-600 hover:text-white border border-white shadow-xl hover:shadow-2xl hover:border-white',
      register:
        'border-2 border-primary-600 text-primary-600 bg-white hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700 shadow-sm hover:shadow-lg transition-all duration-200',
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-10 px-6 py-2.5',
      lg: 'h-12 px-8 text-lg py-3',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
