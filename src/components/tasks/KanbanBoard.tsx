// src/app/components/tasks/KanbanBoard.tsx

'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn as KanbanColumnType } from '@/types/kanban';
import { useTasks, useTaskUpdate } from '@/hooks/useTasks';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  projectId?: number;
  groupId?: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, groupId }) => {
  const { tasks, isLoading, isError, mutate } = useTasks(projectId, groupId);
  const { updateTaskStatus } = useTaskUpdate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Используем useMemo для стабильной структуры колонок
  const columns = useMemo((): KanbanColumnType[] => {
    const typedTasks: Task[] = tasks || [];

    return [
      {
        id: 'TODO',
        title: 'To Do',
        tasks: typedTasks.filter((task: Task) => task.status === 'TODO'),
      },
      {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        tasks: typedTasks.filter((task: Task) => task.status === 'IN_PROGRESS'),
      },
      {
        id: 'REVIEW',
        title: 'Review',
        tasks: typedTasks.filter((task: Task) => task.status === 'REVIEW'),
      },
      {
        id: 'DONE',
        title: 'Done',
        tasks: typedTasks.filter((task: Task) => task.status === 'DONE'),
      },
    ];
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over) return;

    const taskId = parseInt(active.id.toString().replace('task-', ''));
    const newStatus = over.id as TaskStatus;

    // Если задача уже в этой колонке, ничего не делаем
    const taskToUpdate = tasks.find((task: Task) => task.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    const originalStatus = taskToUpdate.status;

    try {
      // Оптимистичное обновление
      const updatedTasks = tasks.map((task: Task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      mutate({ tasks: updatedTasks }, false);

      // Отправляем запрос на сервер
      await updateTaskStatus(taskId, newStatus);

      // Ревалидируем данные с сервера
      mutate();
    } catch (error) {
      console.error('Error updating task status:', error);

      // В случае ошибки возвращаем задачу в исходный статус
      const revertedTasks = tasks.map((task: Task) =>
        task.id === taskId ? { ...task, status: originalStatus } : task
      );

      mutate({ tasks: revertedTasks }, false);

      // Показываем сообщение об ошибке
      alert('Не удалось обновить статус задачи. Пожалуйста, попробуйте еще раз.');
    }
  };

  const activeTask = activeId ? tasks.find((task: Task) => `task-${task.id}` === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-600 p-8">
        Ошибка загрузки задач. Пожалуйста, попробуйте позже.
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {columns.map((column) => (
            <KanbanColumn key={`column-${column.id}`} column={column} />
          ))}
        </div>

        <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
      </DndContext>

      {/* Подсказка для пользователя */}
      {isDragging && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          Перетащите задачу в нужную колонку
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
