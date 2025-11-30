// app/test/activity-log-integration/page.tsx
'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface TestResult {
  success: boolean;
  data?: any;
  status?: number;
  error?: string;
  logs?: any[];
  count?: number;
}

export default function ActivityLogIntegrationTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const testActivityLog = async (action: string) => {
    setLoading(true);
    try {
      let response: Response;

      switch (action) {
        case 'create_user':
          response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: `test${Date.now()}@example.com`,
              password: 'password123',
              firstName: 'Test',
              lastName: 'User',
              role: 'USER',
            }),
          });
          break;

        case 'create_group':
          // Сначала создаем проект для группы
          const projectResponse = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Project for Group ${Date.now()}`,
              description: 'Project for group test',
            }),
          });
          const projectData = await projectResponse.json();

          response = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Test Group ${Date.now()}`,
              description: 'Test group description',
              projectId: projectData.project.id,
            }),
          });
          break;

        case 'create_project':
          response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Test Project ${Date.now()}`,
              description: 'Test project description',
              status: 'ACTIVE',
            }),
          });
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        [action]: {
          success: response.ok,
          data: data,
          status: response.status,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [action]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const checkActivityLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/activity-logs?limit=10');
      const data = await response.json();

      setResults((prev) => ({
        ...prev,
        activity_logs: {
          success: response.ok,
          logs: data.logs,
          count: data.logs.length,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        activity_logs: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧪 Тест интеграции Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Тестовые действия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => testActivityLog('create_user')}
              disabled={loading}
              variant="primary"
            >
              Создать пользователя
            </Button>

            <Button
              onClick={() => testActivityLog('create_group')}
              disabled={loading}
              variant="primary"
            >
              Создать группу
            </Button>

            <Button
              onClick={() => testActivityLog('create_project')}
              disabled={loading}
              variant="primary"
            >
              Создать проект
            </Button>
          </div>

          <Button onClick={checkActivityLogs} disabled={loading} variant="secondary">
            Проверить Activity Log
          </Button>
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(results).map(([action, result]) => (
                <div
                  key={action}
                  className={`p-4 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <h3 className="font-semibold capitalize">
                    {action.replace('_', ' ')}: {result.success ? '✅ Успех' : '❌ Ошибка'}
                  </h3>
                  <pre className="text-sm mt-2 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
