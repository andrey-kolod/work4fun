// src/components/filters/SortSelect.tsx

import React from 'react';
import { Select } from '@/components/ui/Select';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  placeholder?: string;
}

export function SortSelect({
  value,
  onChange,
  options,
  placeholder = 'Сортировка',
}: SortSelectProps) {
  const allOptions = [{ value: '', label: `По умолчанию` }, ...options];

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={allOptions}
      placeholder={placeholder}
    />
  );
}
