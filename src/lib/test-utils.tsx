// lib/test-utils.tsx
import React from 'react';

// Mock провайдер для тестов
export function createTestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// Утилита для мока API запросов
export function mockApiResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

// Утилита для создания тестовых данных
export const createTestUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER' as const,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestGroup = (overrides = {}) => ({
  id: 1,
  name: 'Test Group',
  description: 'Test Description',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  description: 'Test Project Description',
  status: 'ACTIVE' as const,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
