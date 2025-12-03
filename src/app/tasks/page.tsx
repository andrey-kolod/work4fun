// src/app/tasks/page.tsx

'use client';

import { useEffect, useState, Suspense, useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { Loading } from '@/components/ui/Loading';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { SimpleProject } from '@/types';

// Выносим основную логику в отдельный компонент
function TasksContent() {
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProject } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const projectIdFromUrl = searchParams.get('projectId');
  const projectId = projectIdFromUrl ? parseInt(projectIdFromUrl) : selectedProject?.id;

  // 🔧 Инициализируем проект из URL если есть
  useEffect(() => {
    let mounted = true;

    if (projectIdFromUrl && !selectedProject && mounted) {
      console.log(`📥 Loading project from URL: ${projectIdFromUrl}`);
      // Создаем временный проект
      const tempProject: SimpleProject = {
        id: parseInt(projectIdFromUrl),
        name: `Проект ${projectIdFromUrl}`,
        description: '',
        owner: {
          email: '',
          firstName: null,
          lastName: null,
        },
      };
      setSelectedProject(tempProject);
    }

    // Используем requestAnimationFrame для асинхронного обновления
    const timer = setTimeout(() => {
      if (mounted) {
        setIsInitialized(true);
      }
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [projectIdFromUrl, selectedProject, setSelectedProject]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Выберите проект</h1>
          <p className="text-gray-600 mb-6">Для просмотра задач выберите проект в Dashboard</p>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="primary"
            className="flex items-center gap-2 mx-auto"
          >
            📊 Перейти в Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <KanbanBoard projectId={projectId} />
    </div>
  );
}

// Главный компонент с Suspense
export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loading size="lg" />
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
