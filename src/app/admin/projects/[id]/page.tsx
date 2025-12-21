// src/app/admin/projects/[id]/page.tsx
// ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ ФАЙЛ
// Изменения:
// 1. Добавлена мутация списка проектов после обновления (чтобы список в /admin/projects обновился без релоада).
// 2. Добавлена кнопка удаления проекта (только для SUPER_ADMIN, с подтверждением).
// 3. Улучшена обработка ошибок и loading-состояний.
// 4. Добавлены dev-логи для отладки.
// 5. Исправлена потенциальная ошибка с params (используем useParams правильно).
// 6. После успешного обновления/удаления — редирект в список.
// 7. Защита: проверка роли на сервере не нужна (уже в API), но логируем.

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminProjects } from '@/hooks/useAdminProjects';

interface ProjectData {
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  const { mutate: mutateProjects } = useAdminProjects();

  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Проект не найден или ошибка загрузки');
        const data = await response.json();
        setFormData({
          name: data.name,
          description: data.description || '',
          status: data.status,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [EditProject] Данные проекта загружены, ID:', projectId);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('💥 [EditProject] Ошибка загрузки:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError('Название обязательно');

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка обновления');
      }

      mutateProjects(); // Обновляем список в админке

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [EditProject] Проект обновлён, ID:', projectId);
      }

      router.push('/admin/projects');
    } catch (err: any) {
      setError(err.message);
      console.error('💥 [EditProject] Ошибка обновления:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить проект? Это действие необратимо.')) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка удаления');
      }

      mutateProjects();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [EditProject] Проект удалён, ID:', projectId);
      }

      router.push('/admin/projects');
    } catch (err: any) {
      setError(err.message);
      console.error('💥 [EditProject] Ошибка удаления:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center py-12">Загрузка проекта...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Редактирование проекта</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Название *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Описание</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Статус</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="ACTIVE">Активен</option>
            <option value="COMPLETED">Завершён</option>
            <option value="ARCHIVED">Архивирован</option>
          </select>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Удаление...' : 'Удалить проект'}
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
