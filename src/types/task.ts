// types/task.ts

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DelegationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

// Base interfaces for relations
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  status: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  projectId: number;
}

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  taskId?: number;
  parentId?: number;
  mentions?: any;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  replies?: Comment[];
}

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
