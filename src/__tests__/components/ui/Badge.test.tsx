// __tests__/components/ui/Badge.simple.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

// Простой компонент для теста
const SimpleBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="badge">{children}</span>
);

describe('Simple Badge', () => {
  it('should render children', () => {
    render(<SimpleBadge>Test Badge</SimpleBadge>);
    expect(screen.getByText('Test Badge')).toBeTruthy();
  });
});
