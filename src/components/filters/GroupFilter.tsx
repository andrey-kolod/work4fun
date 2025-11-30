// src/components/filters/GroupFilter.tsx

import React from 'react';
import { Select } from '@/components/ui/Select';

interface GroupFilterProps {
  value: number[];
  onChange: (value: number[]) => void;
  groups: { id: number; name: string }[];
  placeholder?: string;
}

export function GroupFilter({ value, onChange, groups, placeholder = 'Группа' }: GroupFilterProps) {
  const options = groups.map((group) => ({
    value: group.id.toString(),
    label: group.name,
  }));

  const allOptions = [{ value: '', label: `Все группы` }, ...options];

  return (
    <Select
      value={value[0]?.toString() || ''}
      onChange={(e) => onChange(e.target.value ? [parseInt(e.target.value)] : [])}
      options={allOptions}
      placeholder={placeholder}
    />
  );
}
