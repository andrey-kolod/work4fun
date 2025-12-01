// src/types/kanban.ts

import { Task, TaskStatus } from './task';

export interface KanbanColumn {
  id: string; // Теперь просто string, так как @dnd-kit использует строки
  title: string;
  tasks: Task[];
}

export interface KanbanBoardProps {
  projectId?: number;
  groupId?: number;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    index: number;
    droppableId: string;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
}
