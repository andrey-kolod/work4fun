// src/components/ui/FormInput.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './Input';
import { Label } from './Label';

interface FormInputProps {
  label: string;
  id: string;
  placeholder: string;
  hasError: boolean;
  isValid: boolean;
  required?: boolean;
  hintMessage: string;
  [key: string]: any;
}

export function FormInput({
  label,
  id,
  placeholder,
  hasError,
  isValid,
  required = false,
  hintMessage,
  ...restProps
}: FormInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const showHint = isFocused || hasError;

  const shouldLabelBeRed = required && !isValid;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[DEV] FormInput: ${id} | focused=`,
      isFocused,
      '| error=',
      hasError,
      '| valid=',
      isValid,
      '| showHint=',
      showHint
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-2">
        <Label
          htmlFor={id}
          className={cn('text-sm font-medium', shouldLabelBeRed && 'text-red-600')}
        >
          {label} {required && '*'}
        </Label>
      </div>

      <Input
        id={id}
        placeholder={placeholder}
        error={hasError}
        success={isValid}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...restProps}
      />

      <div className="min-h-[1.25rem]">
        <div
          className={`transition-all duration-300 ease-in-out ${
            showHint ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
          }`}
        >
          <p className={`text-xs ${hasError ? 'text-red-600' : 'text-gray-500'} pt-1`}>
            {hintMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
