// src/components/filters/RoleFilter.tsx

import React from 'react';
import { Select } from '@/components/ui/Select';

interface RoleFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function RoleFilter({ value, onChange, placeholder = 'Роль' }: RoleFilterProps) {
  const options = [
    { value: 'SUPER_ADMIN', label: 'Супер-админ' },
    { value: 'ADMIN', label: 'Админ' },
    { value: 'USER', label: 'Пользователь' },
  ];

  const allOptions = [{ value: '', label: `Все роли` }, ...options];

  return (
    <Select
      value={value[0] || ''}
      onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      options={allOptions}
      placeholder={placeholder}
    />
  );
}
