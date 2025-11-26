// src/components/filters/StatusFilter.tsx

import React from 'react';
import { Select } from '@/components/ui/Select';

interface StatusFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function StatusFilter({
  value,
  onChange,
  options,
  placeholder = 'Статус',
}: StatusFilterProps) {
  const allOptions = [{ value: '', label: `Все ${placeholder.toLowerCase()}ы` }, ...options];

  return (
    <Select
      value={value[0] || ''}
      onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      options={allOptions}
    />
  );
}
