// src/app/tasks/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskEditClient } from './TaskEditClient';

interface EditTaskPageProps {
  params: {
    id: string;
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Редактирование задачи</h1>
        <p className="text-gray-600">Внесите изменения в задачу и сохраните их</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <TaskEditClient taskId={params.id} userId={session.user.id} userRole={session.user.role} />
      </div>
    </div>
  );
}
