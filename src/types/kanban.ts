// src/types/kanban.ts

import { Task, TaskStatus } from './task';

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  icon: string;
  tasks: Task[];
}

export interface KanbanBoardProps {
  projectId?: number;
  groupId?: number;
}

export interface KanbanBoardData {
  columns: KanbanColumn[];
  totalTasks: number;
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
