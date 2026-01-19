// src/app/project-select/ProjectSelectorClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: number;
  name: string;
  description: string | null;
  owner: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count: {
    tasks: number;
    userProjects: number;
  };
}

interface ProjectSelectorProps {
  projects: Project[];
  userRole: string;
  userName: string;
}

export default function ProjectSelectorClient({
  projects,
  userRole,
  userName,
}: ProjectSelectorProps) {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProjectSelect = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      // 🔧 ИСПРАВЛЕНИЕ: Передаем projectId в URL параметре
      router.push(`/dashboard?projectId=${selectedProject}`);
    } catch (error) {
      console.error('Error selecting project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-surface rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Добро пожаловать, {userName}!
          </h1>
          <p className="text-text-secondary">Выберите проект для работы</p>
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mt-2">
            {userRole}
          </div>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Нет доступных проектов</h3>
            <p className="text-text-secondary">
              {userRole === 'SUPER_ADMIN'
                ? 'Создайте первый проект'
                : 'Обратитьесь к администратору для добавления в проект'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedProject === project.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{project.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                      <span>👥 {project._count.userProjects} участников</span>
                      <span>✅ {project._count.tasks} задач</span>{' '}
                      {/* 🔧 ИСПРАВИЛ: было "участников", должно быть "задач" */}
                      <span>
                        👨‍💼 Владелец: {project.owner.firstName} {project.owner.lastName}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedProject === project.id
                        ? 'bg-primary border-primary'
                        : 'border-gray-300'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleProjectSelect}
          disabled={!selectedProject || isLoading || projects.length === 0}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Загрузка...
            </div>
          ) : (
            'Перейти к проекту'
          )}
        </button>
        {userRole === 'SUPER_ADMIN' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/admin/projects/create')}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Создать новый проект
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
