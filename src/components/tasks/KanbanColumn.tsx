// src/app/components/tasks/KanbanColumn.tsx

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType } from '@/types/kanban';
import TaskCard from './TaskCard';
import { getStatusColor } from '@/lib/tasks';

interface KanbanColumnProps {
  column: KanbanColumnType;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column }) => {
  const statusColor = getStatusColor(column.id);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const taskIds = column.tasks.map((task) => `task-${task.id}`);

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
      {/* Заголовок колонки */}
      <div className={`p-4 rounded-t-lg ${statusColor} text-white`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
            {column.tasks.length}
          </span>
        </div>
      </div>

      {/* Контейнер для задач */}
      <div
        ref={setNodeRef}
        className={`p-3 transition-colors duration-200 min-h-[500px] ${
          isOver ? 'bg-purple-50 bg-opacity-50' : 'bg-transparent'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={`task-${task.id}`} task={task} />
          ))}
        </SortableContext>

        {/* Сообщение если колонка пустая */}
        {column.tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-2">📝</div>
            <p>Нет задач</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
