// src/components/tasks/KanbanBoard.tsx

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn as KanbanColumnType } from '@/types/kanban';
import { useTasks, useTaskUpdate } from '@/hooks/useTasks';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { Button } from '@/components/ui/Button';

interface KanbanBoardProps {
  projectId: number;
  groupId?: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, groupId }) => {
  const { tasks, isLoading, isError, mutate } = useTasks(projectId, groupId);
  const { updateTaskStatus } = useTaskUpdate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const isProcessingRef = useRef(false);

  // Синхронизируем локальные задачи с данными из SWR
  useEffect(() => {
    console.log('KanbanBoard: SWR tasks updated, count:', tasks.length);
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  // Инициализируем локальные задачи при первой загрузке
  useEffect(() => {
    if (tasks.length > 0 && localTasks.length === 0) {
      setLocalTasks(tasks);
    }
  }, [tasks, localTasks.length]);

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

  const columns = useMemo((): KanbanColumnType[] => {
    console.log('KanbanBoard: rendering columns with', localTasks.length, 'tasks');

    // Используем локальные задачи для отображения
    const sortedTasks = [...localTasks].sort((a: Task, b: Task) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Новые сверху (desc)
    });

    console.log(
      'KanbanBoard: sorted tasks:',
      sortedTasks.map((t) => ({ id: t.id, title: t.title }))
    );

    return [
      {
        id: 'TODO',
        title: 'To Do',
        color: 'bg-blue-50 border-blue-200',
        icon: '📝',
        tasks: sortedTasks.filter((task: Task) => task.status === 'TODO'),
      },
      {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        color: 'bg-yellow-50 border-yellow-200',
        icon: '🔄',
        tasks: sortedTasks.filter((task: Task) => task.status === 'IN_PROGRESS'),
      },
      {
        id: 'REVIEW',
        title: 'Review',
        color: 'bg-purple-50 border-purple-200',
        icon: '👀',
        tasks: sortedTasks.filter((task: Task) => task.status === 'REVIEW'),
      },
      {
        id: 'DONE',
        title: 'Done',
        color: 'bg-green-50 border-green-200',
        icon: '✅',
        tasks: sortedTasks.filter((task: Task) => task.status === 'DONE'),
      },
    ];
  }, [localTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    if (isProcessingRef.current) return;
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (isProcessingRef.current || !over) return;

    const taskId = parseInt(active.id.toString().replace('task-', ''));
    let newStatus: TaskStatus;

    const columnIds = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

    if (columnIds.includes(over.id.toString())) {
      newStatus = over.id as TaskStatus;
    } else {
      const targetTaskId = parseInt(over.id.toString().replace('task-', ''));
      const targetTask = localTasks.find((task: Task) => task.id === targetTaskId);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    const taskToUpdate = localTasks.find((task: Task) => task.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    // Устанавливаем флаг обработки
    isProcessingRef.current = true;
    setUpdatingTaskId(taskId);

    try {
      // Оптимистичное обновление локально
      setLocalTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      );

      // Отправляем на сервер
      await updateTaskStatus(taskId, newStatus);

      // Обновляем данные с сервера
      mutate();
    } catch (error: any) {
      console.error('Ошибка обновления задачи:', error);

      // Откатываем локальное изменение
      mutate();

      alert(`Не удалось обновить статус задачи: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        setUpdatingTaskId(null);
      }, 300);
    }
  };

  const activeTask = activeId
    ? localTasks.find((task: Task) => `task-${task.id}` === activeId)
    : null;

  // Индикатор загрузки с затемненным фоном
  if (isLoading && localTasks.length === 0) {
    return (
      <div className="relative min-h-[400px]">
        {/* Затемненный фон */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10"></div>

        {/* Спиннер по центру */}
        <div className="absolute inset-0 flex justify-center items-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Загрузка задач...</p>
            <p className="text-gray-500 text-sm mt-1">Пожалуйста, подождите</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError && localTasks.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
        <p className="text-gray-600">Не удалось загрузить задачи. Пожалуйста, попробуйте позже.</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="primary">
          Обновить страницу
        </Button>
      </div>
    );
  }

  const totalTasks = localTasks.length;
  const hasTasks = totalTasks > 0;

  return (
    <div className="kanban-board min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Упрощенный индикатор загрузки (маленький и в углу) */}
      {updatingTaskId && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">Сохранение...</span>
          </div>
        </div>
      )}

      {/* Если нет задач - показываем ТОЛЬКО предложение создать первую задачу */}
      {!hasTasks ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">📋</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Начните работу с задач
            </h1>
            <p className="text-gray-600 mb-8">
              Создайте первую задачу, чтобы начать работу над проектом
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="lg"
              className="flex items-center gap-2 mx-auto"
            >
              <span>+</span>
              Создать первую задачу
            </Button>
          </div>
        </div>
      ) : (
        /* Если есть задачи - показываем ПОЛНУЮ Kanban доску */
        <>
          {/* Шапка доски */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kanban доска</h1>
                <p className="text-gray-600 mt-2">
                  Перетаскивайте задачи между колонками для изменения статуса
                  {totalTasks > 0 && (
                    <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                      {totalTasks} задач
                    </span>
                  )}
                </p>
              </div>

              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
              >
                <span>+</span>
                Создать задачу
              </Button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              {columns.map((column) => (
                <div key={column.id} className={`${column.color} border rounded-lg p-3 md:p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{column.icon}</span>
                    <span className="font-medium text-gray-900 text-sm md:text-base">
                      {column.title}
                    </span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {column.tasks.length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">задачи</p>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban доска */}
          <div className="max-w-7xl mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {columns.map((column) => (
                  <KanbanColumn
                    key={`column-${column.id}`}
                    column={column}
                    updatingTaskId={updatingTaskId}
                  />
                ))}
              </div>

              {/* DragOverlay для перетаскивания */}
              <DragOverlay>
                {activeTask && (
                  <div className="rotate-3 shadow-2xl border-2 border-purple-300">
                    <TaskCard task={activeTask} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </>
      )}

      {/* Модальное окно создания задачи */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newTask) => {
            console.log('KanbanBoard: Новая задача получена:', newTask);

            if (newTask) {
              // 1. Добавляем задачу в локальный список сразу
              setLocalTasks((prev) => [newTask, ...prev]);

              // 2. Обновляем данные с сервера с небольшой задержкой
              setTimeout(() => {
                mutate(undefined, { revalidate: true });
              }, 300);
            } else {
              // Если задача не передана, просто ревалидируем
              mutate(undefined, { revalidate: true });
            }
          }}
          projectId={projectId} // ✅ Обязательно передайте projectId!
        />
      )}

      {/* Подсказка при перетаскивании */}
      {isDragging && hasTasks && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg animate-pulse flex items-center gap-2 text-sm md:text-base">
          <span className="animate-bounce hidden md:inline">↓</span>
          <span>Перетащите в нужную колонку</span>
          <span className="animate-bounce hidden md:inline">↓</span>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
