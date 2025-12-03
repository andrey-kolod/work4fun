// src/components/tasks/KanbanColumn.tsx
import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import { KanbanColumn as KanbanColumnType } from '@/types/kanban';

interface KanbanColumnProps {
  column: KanbanColumnType;
  updatingTaskId?: number | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, updatingTaskId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${column.color} border-2 rounded-xl p-3 md:p-4 lg:p-5 min-h-[300px] md:min-h-[400px] lg:min-h-[500px] transition-all duration-200 ${
        isOver ? 'ring-2 ring-purple-400 ring-offset-1 md:ring-offset-2' : ''
      }`}
    >
      {/* Заголовок колонки - адаптивный */}
      <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-5 pb-2 md:pb-3 lg:pb-4 border-b">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-lg md:text-xl">{column.icon}</span>
          <div>
            <h3 className="font-bold text-base md:text-lg text-gray-900">{column.title}</h3>
            <p className="text-xs md:text-sm text-gray-600 hidden md:block">Управление задачами</p>
          </div>
        </div>
        <span className="bg-white text-gray-900 font-bold px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm border">
          {column.tasks.length}
        </span>
      </div>

      {/* Список задач */}
      <SortableContext
        items={column.tasks.map((task) => `task-${task.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
          {column.tasks.map((task) => (
            <div
              key={task.id}
              className={`
                transition-all duration-300
                ${
                  updatingTaskId === task.id
                    ? 'opacity-70 transform scale-[0.98]'
                    : 'hover:transform hover:scale-[1.01]'
                }
              `}
            >
              <TaskCard task={task} isUpdating={updatingTaskId === task.id} />
            </div>
          ))}
        </div>
      </SortableContext>

      {/* Пустая колонка - только если есть задачи на доске */}
      {column.tasks.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4 opacity-50">{column.icon}</div>
          <p className="text-gray-500 font-medium text-sm md:text-base">Нет задач</p>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Перетащите сюда задачу</p>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
