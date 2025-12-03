// src/types/task.ts

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DelegationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  groupId?: number;
  creatorId: number;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
  group?: Group;
  creator?: User;
  assignments?: TaskAssignment[];
  delegations?: TaskDelegation[];
  comments?: Comment[];
}

export interface TaskAssignment {
  id: number;
  taskId: number;
  userId: number;
  assignedBy: number;
  assignedAt: Date;

  // Relations
  task?: Task;
  user?: User;
}

export interface TaskDelegation {
  id: number;
  taskId: number;
  fromUserId: number;
  toUserId: number;
  status: DelegationStatus;
  reason?: string;
  responseNote?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  task?: Task;
  fromUser?: User;
  toUser?: User;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: number;
  groupId?: number;
  dueDate?: Date;
  estimatedHours?: number;
  assigneeIds: number[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  assigneeIds?: number[];
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: string;
  projectId?: number;
  groupId?: number;
  assigneeIds?: number[];
}

// Дополнительные типы
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
}

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}
