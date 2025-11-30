// app/test/api-integration/page.tsx

// http://localhost:3000/test/api-integration

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface TestResult {
  status?: number;
  statusText?: string;
  success: boolean;
  error?: string;
}

export default function ApiIntegrationTest() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const endpoints = [
      { name: 'Users List', url: '/api/users' },
      { name: 'Groups List', url: '/api/groups' },
      { name: 'Projects List', url: '/api/projects' },
      { name: 'Activity Logs', url: '/api/activity-logs' },
    ];

    const results: Record<string, TestResult> = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        results[endpoint.name] = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
        };
      } catch (error) {
        results[endpoint.name] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }

    setResults(results);
    setTesting(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">API Integration Test</h1>

      <Button onClick={testEndpoints} disabled={testing}>
        {testing ? 'Testing...' : 'Test All Endpoints'}
      </Button>

      <div className="grid gap-4">
        {Object.entries(results).map(([name, result]) => (
          <div
            key={name}
            className={`p-4 border rounded-lg ${
              result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <h3 className="font-semibold">{name}</h3>
            <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
