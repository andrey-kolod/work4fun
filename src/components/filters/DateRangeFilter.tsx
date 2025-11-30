// src/components/filters/DateRangeFilter.tsx

import React from 'react';
import { Input } from '@/components/ui/Input';

interface DateRangeFilterProps {
  value: { start: Date; end: Date } | null;
  onChange: (value: { start: Date; end: Date } | null) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value ? new Date(e.target.value) : null;
    const end = value?.end || null;

    if (start && end) {
      onChange({ start, end });
    } else if (start) {
      onChange({ start, end: start });
    } else {
      onChange(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = value?.start || null;
    const end = e.target.value ? new Date(e.target.value) : null;

    if (start && end) {
      onChange({ start, end });
    } else if (end) {
      onChange({ start: end, end });
    } else {
      onChange(null);
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        type="date"
        value={value?.start.toISOString().split('T')[0] || ''}
        onChange={handleStartDateChange}
        placeholder="Начало"
      />
      <Input
        type="date"
        value={value?.end.toISOString().split('T')[0] || ''}
        onChange={handleEndDateChange}
        placeholder="Конец"
      />
    </div>
  );
}
