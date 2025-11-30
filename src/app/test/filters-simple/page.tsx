// src/app/test/filters-simple/page.tsx

// http://localhost:3000/test/filters-simple

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

// Простые компоненты фильтров для тестирования
const SimpleSearchInput = ({ value, onChange, placeholder }: any) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md"
    />
  );
};

const SimpleSelect = ({ value, onChange, options, placeholder }: any) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md"
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const SimpleDateRange = ({ value, onChange }: any) => {
  return (
    <div className="flex space-x-2">
      <input
        type="date"
        value={value?.start || ''}
        onChange={(e) => onChange({ ...value, start: e.target.value })}
        className="flex-1 p-2 border border-gray-300 rounded-md"
      />
      <input
        type="date"
        value={value?.end || ''}
        onChange={(e) => onChange({ ...value, end: e.target.value })}
        className="flex-1 p-2 border border-gray-300 rounded-md"
      />
    </div>
  );
};

export default function SimpleFiltersTest() {
  // Состояния фильтров
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Опции для селектов
  const roleOptions = [
    { value: 'ADMIN', label: 'Администратор' },
    { value: 'USER', label: 'Пользователь' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Активен' },
    { value: 'inactive', label: 'Неактивен' },
  ];

  // Сброс фильтров
  const resetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setDateRange({ start: '', end: '' });
  };

  // Проверка активных фильтров
  const hasActiveFilters = search || role || status || dateRange.start || dateRange.end;

  // Тестовые данные
  const testData = [
    { id: 1, name: 'Иван Иванов', role: 'ADMIN', status: 'active', date: '2024-01-15' },
    { id: 2, name: 'Петр Петров', role: 'USER', status: 'active', date: '2024-01-10' },
    { id: 3, name: 'Мария Сидорова', role: 'USER', status: 'inactive', date: '2024-01-20' },
  ];

  // Фильтрация данных
  const filteredData = testData.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (role && item.role !== role) return false;
    if (status && item.status !== status) return false;
    if (dateRange.start && item.date < dateRange.start) return false;
    if (dateRange.end && item.date > dateRange.end) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">🧪 Простой тест фильтров</h1>

      {/* Карточка с фильтрами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Фильтры</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Сбросить все
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Строка 1: Поиск и роль */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Поиск</label>
              <SimpleSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Поиск по имени..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Роль</label>
              <SimpleSelect
                value={role}
                onChange={setRole}
                options={roleOptions}
                placeholder="Все роли"
              />
            </div>
          </div>

          {/* Строка 2: Статус и даты */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Статус</label>
              <SimpleSelect
                value={status}
                onChange={setStatus}
                options={statusOptions}
                placeholder="Все статусы"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Диапазон дат</label>
              <SimpleDateRange value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {/* Активные фильтры */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Активные фильтры:</h4>
            <div className="flex flex-wrap gap-2">
              {search && <Badge>Поиск: &quot;{search}&quot;</Badge>}
              {role && (
                <Badge variant="warning">
                  Роль: {roleOptions.find((r) => r.value === role)?.label}
                </Badge>
              )}
              {status && (
                <Badge variant="info">
                  Статус: {statusOptions.find((s) => s.value === status)?.label}
                </Badge>
              )}
              {dateRange.start && <Badge variant="success">С: {dateRange.start}</Badge>}
              {dateRange.end && <Badge variant="success">По: {dateRange.end}</Badge>}
              {!hasActiveFilters && <span className="text-gray-500">Нет активных фильтров</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Результаты фильтрации */}
      <Card>
        <CardHeader>
          <CardTitle>
            Результаты ({filteredData.length} из {testData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={item.role === 'ADMIN' ? 'warning' : 'default'}>
                      {item.role === 'ADMIN' ? 'Админ' : 'Пользователь'}
                    </Badge>
                    <Badge variant={item.status === 'active' ? 'success' : 'error'}>
                      {item.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Ничего не найдено. Попробуйте изменить фильтры.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Инструкция по тестированию */}
      <Card>
        <CardHeader>
          <CardTitle>Инструкция по тестированию</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Что тестируем:</h4>
              <ul className="mt-2 text-blue-700 space-y-1">
                <li>• Поиск по имени (попробуйте &quot;Иван&quot; или &quot;Мария&quot;)</li>
                <li>• Фильтр по роли (Администратор/Пользователь)</li>
                <li>• Фильтр по статусу (Активен/Неактивен)</li>
                <li>• Фильтр по датам</li>
                <li>• Комбинации фильтров</li>
                <li>• Сброс фильтров</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Примеры для теста:</h4>
              <ul className="mt-2 text-green-700 space-y-1">
                <li>• Только поиск: &quot;Иван&quot;</li>
                <li>• Роль + статус: Администратор + Активен</li>
                <li>• Все фильтры вместе</li>
                <li>• Сброс кнопкой &quot;Сбросить все&quot;</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
