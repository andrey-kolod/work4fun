// src/app/components/tasks/TaskCard.tsx

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { getPriorityColor } from '@/lib/tasks';
import Link from 'next/link';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const priorityColor = getPriorityColor(task.priority);
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'DONE';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Получаем имя пользователя
  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    return user?.email?.split('@')[0] || 'U';
  };

  // Получаем инициалы для аватара
  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-3 p-4 cursor-grab transition-all duration-200 ${
        isDragging ? 'shadow-lg rotate-2 opacity-50' : 'hover:shadow-md'
      } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      {/* Заголовок и приоритет */}
      <div className="flex justify-between items-start mb-2">
        <Link
          href={`/tasks/${task.id}`}
          className="font-medium text-gray-900 hover:text-purple-600 line-clamp-2 flex-1 mr-2"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <span className={`text-xs font-medium ${priorityColor}`}>{task.priority}</span>
      </div>

      {/* Описание */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Мета-информация */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* Исполнители */}
        <div className="flex items-center space-x-1">
          {task.assignments?.slice(0, 2).map((assignment) => (
            <div
              key={`assignment-${assignment.id}`}
              className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium text-xs"
              title={getUserName(assignment.user)}
            >
              {getUserInitials(assignment.user)}
            </div>
          ))}
          {task.assignments && task.assignments.length > 2 && (
            <span className="text-xs">+{task.assignments.length - 2}</span>
          )}
        </div>

        {/* Дата и время */}
        <div className="flex items-center space-x-2">
          {dueDate && (
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              {dueDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
          {task.estimatedHours && (
            <span className="bg-gray-100 px-2 py-1 rounded">{task.estimatedHours}h</span>
          )}
        </div>
      </div>

      {/* Бейдж делегирования */}
      {task.delegations && task.delegations.some((d) => d.status === 'PENDING') && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Делегируется
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
