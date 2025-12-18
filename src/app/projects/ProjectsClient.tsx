// ФАЙЛ: src/app/project-select/ProjectClient.tsx
// НАЗНАЧЕНИЕ: Клиентская часть страницы выбора проекта

'use client';

import { useState } from 'react'; // useState — храним, какой проект выбран
import { useRouter } from 'next/navigation'; // useRouter — для перехода на /tasks

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

export default function ProjectClient({ projects, userRole, userName }: ProjectSelectorProps) {
  const [selectedProject, setSelectedProject] = useState<number | null>(
    projects.length === 1 ? projects[0].id : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProjectSelect = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      router.push(`/tasks?projectId=${selectedProject}`);
    } catch (error) {
      console.error('Ошибка при выборе проекта:', error);
      alert('Не получилось перейти к проекту');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    router.push('/admin/projects/create');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Супер-администратор';
      case 'PROJECT_LEAD':
        return 'Руководитель проекта';
      case 'PROJECT_MEMBER':
        return 'Участник проекта';
      default:
        return role;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать, {userName}!</h1>
          <p className="text-gray-600">Выберите проект для работы</p>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
            {getRoleDisplay(userRole)}
          </div>
        </div>

        {/* Если проектов нет */}
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет доступных проектов</h3>
            <p className="text-gray-600 mb-4">
              {userRole === 'SUPER_ADMIN'
                ? 'Создайте первый проект'
                : 'Обратитесь к администратору для добавления в проект'}
            </p>
            {userRole === 'SUPER_ADMIN' && (
              <button
                onClick={handleCreateProject}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Создать новый проект
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Список проектов */}
            <div className="space-y-4 mb-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProject === project.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>👥 участников: {project._count?.userProjects || '–'}</span>
                        <span>✅ задач: {project._count?.tasks || '–'}</span>
                        <span>
                          👨‍💼 Владелец: {project.owner.firstName || ''}{' '}
                          {project.owner.lastName || ''}
                          {!project.owner.firstName &&
                            !project.owner.lastName &&
                            project.owner.email}
                        </span>
                      </div>
                    </div>

                    {/* Кружок "выбран" */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedProject === project.id
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedProject === project.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка "Перейти к проекту" */}
            <button
              onClick={handleProjectSelect}
              disabled={!selectedProject || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Переход...
                </div>
              ) : (
                'Перейти к проекту'
              )}
            </button>

            {/* Кнопка "Создать новый проект" — только супер-админу */}
            {userRole === 'SUPER_ADMIN' && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleCreateProject}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                >
                  Создать новый проект
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
