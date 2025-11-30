// src/lib/tasks.ts
import { Task, TaskStatus, TaskPriority } from '@/types/task';

export const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    TODO: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    REVIEW: 'bg-yellow-500',
    DONE: 'bg-green-500',
  };
  return colors[status];
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    LOW: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    HIGH: 'text-orange-600',
    URGENT: 'text-red-600',
  };
  return colors[priority];
};

export const canEditTask = (task: Task, userId: number, userRole: string): boolean => {
  if (userRole === 'SUPER_ADMIN') return true;
  if (task.creatorId === userId) return true;

  // Additional project admin checks can be added here
  return false;
};

export const formatTaskDueDate = (dueDate?: Date): string => {
  if (!dueDate) return 'No deadline';

  const now = new Date();
  const taskDate = new Date(dueDate);
  const diffTime = taskDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;

  return `In ${diffDays} days`;
};
