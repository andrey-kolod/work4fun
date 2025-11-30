// src/components/filters/FilterReset.tsx

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

interface FilterResetProps {
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterReset({ onReset, hasActiveFilters }: FilterResetProps) {
  if (!hasActiveFilters) return null;

  return (
    <Button variant="ghost" size="sm" onClick={onReset} className="flex items-center space-x-1">
      <Trash2 className="h-4 w-4" />
      <span>Сбросить</span>
    </Button>
  );
}
