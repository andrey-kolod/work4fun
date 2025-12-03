// src/components/tasks/TaskCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  isUpdating?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isUpdating = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // 🔧 ИСПРАВЛЕНИЕ: Безопасное форматирование даты
  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return 'Нет срока';

    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

      if (isNaN(date.getTime())) {
        return 'Нет срока';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      if (compareDate.getTime() === today.getTime()) {
        return 'Сегодня';
      }

      const diffDays = Math.round(
        (compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) return 'Завтра';
      if (diffDays === -1) return 'Вчера';
      if (diffDays < 0) return `${Math.abs(diffDays)} дн. назад`;

      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    } catch (error) {
      return 'Нет срока';
    }
  };

  // 🔧 Компактный вид для мобильных
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md border border-gray-200 p-3 md:p-4 lg:p-5
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-30 shadow-xl md:shadow-2xl scale-105' : ''}
        ${isUpdating ? 'border-2 border-purple-300 animate-pulse' : 'hover:shadow-md md:hover:shadow-lg hover:border-purple-300'}
        relative
      `}
    >
      {/* Индикатор обновления */}
      {isUpdating && !isMobile && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-10">
          <div className="bg-purple-600 text-white text-xs px-1 py-0.5 md:px-2 md:py-1 rounded-full animate-pulse flex items-center gap-0.5 md:gap-1">
            <div className="h-1 w-1 md:h-2 md:w-2 bg-white rounded-full animate-ping"></div>
            <span className="hidden md:inline">Сохранение</span>
          </div>
        </div>
      )}

      {/* Заголовок задачи */}
      <div className="mb-2 md:mb-3 lg:mb-4">
        <h4 className="font-bold text-gray-900 text-sm md:text-base lg:text-lg line-clamp-2">
          {task.title}
        </h4>
        {task.description && !isMobile && (
          <p className="text-gray-600 text-xs md:text-sm mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Мета-информация */}
      <div className="space-y-2 md:space-y-3">
        {/* Приоритет и срок */}
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span
            className={`text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full ${getPriorityColor(task.priority)}`}
          >
            {isMobile
              ? task.priority === 'URGENT'
                ? '❗'
                : task.priority === 'HIGH'
                  ? '🔺'
                  : task.priority === 'MEDIUM'
                    ? '🟡'
                    : '🟢'
              : task.priority === 'URGENT'
                ? 'СРОЧНО'
                : task.priority === 'HIGH'
                  ? 'ВЫСОКИЙ'
                  : task.priority === 'MEDIUM'
                    ? 'СРЕДНИЙ'
                    : 'НИЗКИЙ'}
          </span>

          {task.dueDate && !isMobile && (
            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-700">
              <span className="text-gray-400">⏰</span>
              <span className="font-medium">{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Исполнители - скрываем на очень маленьких экранах */}
        {task.assignments && task.assignments.length > 0 && !isMobile && (
          <div className="border-t border-gray-100 pt-2 md:pt-3">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1 md:-space-x-2">
                {task.assignments.slice(0, isMobile ? 2 : 3).map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className={`
                      w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full border-2 border-white flex items-center justify-center 
                      text-xs font-bold shadow-sm
                      ${index === 0 ? 'bg-purple-100 text-purple-800' : ''}
                      ${index === 1 ? 'bg-blue-100 text-blue-800' : ''}
                      ${index === 2 ? 'bg-green-100 text-green-800' : ''}
                    `}
                    title={`${assignment.user?.firstName || assignment.user?.email || 'Исполнитель'}`}
                  >
                    {assignment.user?.firstName?.[0] || assignment.user?.email?.[0] || '?'}
                  </div>
                ))}
                {task.assignments.length > (isMobile ? 2 : 3) && (
                  <div
                    className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm"
                    title={`Ещё ${task.assignments.length - (isMobile ? 2 : 3)} исполнителей`}
                  >
                    +{task.assignments.length - (isMobile ? 2 : 3)}
                  </div>
                )}
              </div>

              {!isMobile && (
                <span className="text-xs text-gray-500">
                  {task.assignments.length} исполнителей
                </span>
              )}
            </div>
          </div>
        )}

        {/* Создатель - только на десктопе */}
        {task.creator && !isMobile && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
            <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
              {task.creator.firstName?.[0] || task.creator.email?.[0] || 'C'}
            </div>
            <span>{task.creator.firstName ? `от ${task.creator.firstName}` : 'Создатель'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
