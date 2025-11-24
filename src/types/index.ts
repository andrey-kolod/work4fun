// src/types/index.ts
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  avatar?: string;
  groupId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DelegationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DELEGATED = 'TASK_DELEGATED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  NEW_COMMENT = 'NEW_COMMENT',
  MENTIONED = 'MENTIONED',
  DEADLINE_SOON = 'DEADLINE_SOON',
  DEADLINE_PASSED = 'DEADLINE_PASSED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
}
