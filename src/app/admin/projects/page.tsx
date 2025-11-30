// // src/app/admin/projects/page.tsx

// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';

// interface ProjectOwner {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
// }

// interface ProjectStats {
//   totalTasks: number;
//   totalUsers: number;
//   totalGroups: number;
//   completedTasks: number;
// }

// interface ProjectWithDetails {
//   id: number;
//   name: string;
//   description: string;
//   status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
//   owner: ProjectOwner;
//   progress: number;
//   stats: ProjectStats;
//   createdAt: string;
//   updatedAt: string;
// }

// interface ProjectsResponse {
//   projects: ProjectWithDetails[];
//   pagination: {
//     page: number;
//     pageSize: number;
//     total: number;
//     totalPages: number;
//   };
// }

// export default function ProjectsPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [projectToDelete, setProjectToDelete] = useState<ProjectWithDetails | null>(null);
//   const [filters, setFilters] = useState({
//     search: '',
//     status: '' as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | '',
//   });
//   const [pagination, setPagination] = useState({
//     page: 1,
//     pageSize: 10,
//     total: 0,
//   });

//   const fetchProjects = async () => {
//     try {
//       setLoading(true);

//       const params = new URLSearchParams();
//       if (filters.search) params.append('search', filters.search);
//       if (filters.status) params.append('status', filters.status);
//       params.append('page', pagination.page.toString());
//       params.append('pageSize', pagination.pageSize.toString());

//       const response = await fetch(`/api/projects?${params.toString()}`);

//       if (!response.ok) {
//         throw new Error('Ошибка при загрузке проектов');
//       }

//       const data: ProjectsResponse = await response.json();
//       setProjects(data.projects);
//       setPagination((prev) => ({ ...prev, total: data.pagination.total }));
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, [filters, pagination.page, pagination.pageSize]);

//   const handleSearch = (search: string) => {
//     setFilters((prev) => ({ ...prev, search }));
//     setPagination((prev) => ({ ...prev, page: 1 }));
//   };

//   const handleStatusFilter = (status: string) => {
//     setFilters((prev) => ({ ...prev, status: status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | '' }));
//     setPagination((prev) => ({ ...prev, page: 1 }));
//   };

//   const handleEdit = (project: ProjectWithDetails) => {
//     router.push(`/admin/projects/${project.id}`);
//   };

//   const handleDelete = (project: ProjectWithDetails) => {
//     setProjectToDelete(project);
//     setDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!projectToDelete) return;

//     try {
//       const response = await fetch(`/api/projects/${projectToDelete.id}`, {
//         method: 'DELETE',
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Ошибка при удалении проекта');
//       }

//       await fetchProjects();
//       setDeleteModalOpen(false);
//       setProjectToDelete(null);
//     } catch (error) {
//       console.error('Error deleting project:', error);
//       alert((error as Error).message);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const variants = {
//       ACTIVE: 'bg-green-100 text-green-800',
//       COMPLETED: 'bg-blue-100 text-blue-800',
//       ARCHIVED: 'bg-gray-100 text-gray-800',
//     };

//     const labels = {
//       ACTIVE: 'Активен',
//       COMPLETED: 'Завершен',
//       ARCHIVED: 'Архивирован',
//     };

//     return (
//       <span
//         className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variants[status as keyof typeof variants] || variants.ARCHIVED}`}
//       >
//         {labels[status as keyof typeof labels] || status}
//       </span>
//     );
//   };

//   const statusOptions = [
//     { value: '', label: 'Все статусы' },
//     { value: 'ACTIVE', label: 'Активен' },
//     { value: 'COMPLETED', label: 'Завершен' },
//     { value: 'ARCHIVED', label: 'Архивирован' },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Заголовок и кнопка создания */}
//         <div className="mb-8">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Проекты</h1>
//               <p className="mt-2 text-sm text-gray-600">Управление проектами в системе</p>
//             </div>
//             <button
//               onClick={() => router.push('/admin/projects/create')}
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               Создать проект
//             </button>
//           </div>
//         </div>

//         {/* Фильтры */}
//         <div className="bg-white p-6 rounded-lg shadow mb-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
//                 Поиск проектов
//               </label>
//               <input
//                 type="text"
//                 id="search"
//                 value={filters.search}
//                 onChange={(e) => handleSearch(e.target.value)}
//                 placeholder="Поиск по названию проекта..."
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               />
//             </div>
//             <div>
//               <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
//                 Статус
//               </label>
//               <select
//                 id="status"
//                 value={filters.status}
//                 onChange={(e) => handleStatusFilter(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 {statusOptions.map((option) => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Таблица проектов */}
//         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
//           {loading ? (
//             <div className="p-8 text-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//               <p className="mt-2 text-gray-600">Загрузка проектов...</p>
//             </div>
//           ) : projects.length === 0 ? (
//             <div className="p-8 text-center">
//               <svg
//                 className="mx-auto h-12 w-12 text-gray-400"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                 />
//               </svg>
//               <h3 className="mt-2 text-sm font-medium text-gray-900">Нет проектов</h3>
//               <p className="mt-1 text-sm text-gray-500">Начните с создания первого проекта.</p>
//               <div className="mt-6">
//                 <button
//                   onClick={() => router.push('/admin/projects/create')}
//                   className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   Создать проект
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Название проекта
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Описание
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Статус
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Прогресс
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Владелец
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Статистика
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Дата создания
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Действия
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {projects.map((project) => (
//                     <tr key={project.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">{project.name}</div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-500 max-w-xs truncate">
//                           {project.description || '—'}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {getStatusBadge(project.status)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center space-x-2">
//                           <div className="w-16 bg-gray-200 rounded-full h-2">
//                             <div
//                               className="bg-green-600 h-2 rounded-full"
//                               style={{ width: `${project.progress}%` }}
//                             />
//                           </div>
//                           <span className="text-sm text-gray-600">{project.progress}%</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           {project.owner.firstName} {project.owner.lastName}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-600">
//                           {project.stats.totalTasks} задач, {project.stats.totalUsers} участников
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {new Date(project.createdAt).toLocaleDateString('ru-RU')}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                         <button
//                           onClick={() => handleEdit(project)}
//                           className="text-blue-600 hover:text-blue-900"
//                         >
//                           Редактировать
//                         </button>
//                         <button
//                           onClick={() => handleDelete(project)}
//                           className="text-red-600 hover:text-red-900"
//                         >
//                           Удалить
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Пагинация */}
//         {projects.length > 0 && (
//           <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
//             <div className="flex-1 flex justify-between items-center">
//               <div>
//                 <p className="text-sm text-gray-700">
//                   Показано{' '}
//                   <span className="font-medium">
//                     {(pagination.page - 1) * pagination.pageSize + 1}
//                   </span>{' '}
//                   -{' '}
//                   <span className="font-medium">
//                     {Math.min(pagination.page * pagination.pageSize, pagination.total)}
//                   </span>{' '}
//                   из <span className="font-medium">{pagination.total}</span> проектов
//                 </p>
//               </div>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
//                   disabled={pagination.page === 1}
//                   className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Назад
//                 </button>
//                 <button
//                   onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
//                   disabled={pagination.page * pagination.pageSize >= pagination.total}
//                   className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Вперед
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Модалка подтверждения удаления */}
//         {deleteModalOpen && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//             <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
//               <div className="mt-3">
//                 <h3 className="text-lg font-medium text-gray-900">Подтверждение удаления</h3>
//                 <div className="mt-2">
//                   <p className="text-sm text-gray-500">
//                     Вы уверены, что хотите удалить проект <strong>{projectToDelete?.name}</strong>?
//                   </p>
//                   {(projectToDelete?.stats?.totalGroups || 0) > 0 && (
//                     <p className="text-sm text-red-600 mt-2">
//                       Внимание: в проекте есть группы! Сначала удалите все группы.
//                     </p>
//                   )}
//                   {(projectToDelete?.stats?.totalTasks || 0) > 0 && (
//                     <p className="text-sm text-red-600 mt-2">
//                       Внимание: в проекте есть задачи! Сначала удалите все задачи.
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex justify-end space-x-3 mt-4">
//                   <button
//                     onClick={() => setDeleteModalOpen(false)}
//                     className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                   >
//                     Отмена
//                   </button>
//                   <button
//                     onClick={confirmDelete}
//                     disabled={
//                       (projectToDelete?.stats?.totalGroups || 0) > 0 ||
//                       (projectToDelete?.stats?.totalTasks || 0) > 0
//                     }
//                     className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Удалить
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectOwner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectStats {
  totalTasks: number;
  totalUsers: number;
  totalGroups: number;
  completedTasks: number;
}

interface ProjectWithDetails {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  owner: ProjectOwner;
  progress: number;
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: ProjectWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false); // Новое состояние для индикатора удаления
  const [filters, setFilters] = useState({
    search: '',
    status: '' as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/projects?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Ошибка при загрузке проектов');
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters, pagination.page, pagination.pageSize]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | '' }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (project: ProjectWithDetails) => {
    router.push(`/admin/projects/${project.id}`);
  };

  const handleDelete = (project: ProjectWithDetails) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setDeleting(true); // Начинаем процесс удаления

      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении проекта');
      }

      await fetchProjects();
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert((error as Error).message);
    } finally {
      setDeleting(false); // Заканчиваем процесс удаления
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      ACTIVE: 'Активен',
      COMPLETED: 'Завершен',
      ARCHIVED: 'Архивирован',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variants[status as keyof typeof variants] || variants.ARCHIVED}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'ACTIVE', label: 'Активен' },
    { value: 'COMPLETED', label: 'Завершен' },
    { value: 'ARCHIVED', label: 'Архивирован' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок и кнопка создания */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Проекты</h1>
              <p className="mt-2 text-sm text-gray-600">Управление проектами в системе</p>
            </div>
            <button
              onClick={() => router.push('/admin/projects/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Создать проект
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Поиск проектов
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Поиск по названию проекта..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Таблица проектов */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка проектов...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Нет проектов</h3>
              <p className="mt-1 text-sm text-gray-500">Начните с создания первого проекта.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/projects/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Создать проект
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название проекта
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Прогресс
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Владелец
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статистика
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {project.description || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(project.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.owner.firstName} {project.owner.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {project.stats.totalTasks} задач, {project.stats.totalUsers} участников
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={deleting} // Блокируем редактирование во время удаления
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={deleting} // Блокируем удаление других проектов во время процесса
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {projects.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Показано{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  из <span className="font-medium">{pagination.total}</span> проектов
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || deleting} // Блокируем пагинацию во время удаления
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.pageSize >= pagination.total || deleting} // Блокируем пагинацию во время удаления
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка подтверждения удаления */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {deleting ? 'Удаление проекта...' : 'Подтверждение удаления'}
                </h3>
                <div className="mt-2">
                  {deleting ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                      <p className="text-sm text-gray-600">Идет удаление проекта...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">
                        Вы уверены, что хотите удалить проект{' '}
                        <strong>{projectToDelete?.name}</strong>?
                      </p>
                      {(projectToDelete?.stats?.totalGroups || 0) > 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Внимание: в проекте есть группы! Сначала удалите все группы.
                        </p>
                      )}
                      {(projectToDelete?.stats?.totalTasks || 0) > 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Внимание: в проекте есть задачи! Сначала удалите все задачи.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  {!deleting && (
                    <button
                      onClick={() => setDeleteModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Отмена
                    </button>
                  )}
                  <button
                    onClick={confirmDelete}
                    disabled={
                      deleting ||
                      (projectToDelete?.stats?.totalGroups || 0) > 0 ||
                      (projectToDelete?.stats?.totalTasks || 0) > 0
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {deleting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Удаление...
                      </>
                    ) : (
                      'Удалить'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Глобальный индикатор загрузки при удалении */}
        {deleting && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="text-gray-700">Удаление проекта...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
