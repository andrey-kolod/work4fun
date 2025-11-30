// components/admin/ActivityLog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Table, Badge } from '@/components/ui';
import { Loading } from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/Pagination';

interface ActivityLog {
  id: number;
  actionType: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

// Определяем тип для данных таблицы
interface TableData {
  id: string;
  actionDisplay: React.ReactNode;
  entityDisplay: string;
  userDisplay: string;
  dateDisplay: string;
}

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/activity-logs?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionVariant = (
    actionType: string
  ): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (actionType) {
      case 'CREATE':
      case 'USER_CREATED':
      case 'ACTIVATE':
      case 'USER_ACTIVATED':
        return 'success';
      case 'UPDATE':
      case 'USER_UPDATED':
        return 'info';
      case 'DELETE':
      case 'USER_DELETED':
        return 'error';
      case 'DEACTIVATE':
      case 'USER_DEACTIVATED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getActionText = (actionType: string): string => {
    switch (actionType) {
      case 'CREATE':
      case 'USER_CREATED':
        return 'Создание';
      case 'UPDATE':
      case 'USER_UPDATED':
        return 'Обновление';
      case 'DELETE':
      case 'USER_DELETED':
        return 'Удаление';
      case 'ACTIVATE':
      case 'USER_ACTIVATED':
        return 'Активация';
      case 'DEACTIVATE':
      case 'USER_DEACTIVATED':
        return 'Деактивация';
      default:
        return actionType;
    }
  };

  // Подготавливаем данные для таблицы
  const tableData: TableData[] = logs.map((log) => ({
    id: log.id.toString(),
    actionDisplay: (
      <Badge variant={getActionVariant(log.actionType)}>{getActionText(log.actionType)}</Badge>
    ),
    entityDisplay: `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}`,
    userDisplay: `${log.user.firstName} ${log.user.lastName}`,
    dateDisplay: new Date(log.createdAt).toLocaleString('ru-RU'),
  }));

  // Колонки с правильными ключами, которые точно есть в TableData
  const columns = [
    {
      key: 'actionDisplay' as const,
      title: 'Действие',
    },
    {
      key: 'entityDisplay' as const,
      title: 'Сущность',
    },
    {
      key: 'userDisplay' as const,
      title: 'Пользователь',
    },
    {
      key: 'dateDisplay' as const,
      title: 'Дата',
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">История действий</h2>

      <Table columns={columns} data={tableData} />

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={fetchLogs}
        />
      )}
    </div>
  );
}
