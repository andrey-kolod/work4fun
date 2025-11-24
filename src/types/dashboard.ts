// src/types/dashboard.ts
export interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  owner: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  _count: {
    tasks: number;
    userProjects: number;
    groups?: number;
  };
}

export interface TaskStat {
  status: string;
  count: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId: number;
  creatorId: number;
  creator: User;
  group?: {
    id: number;
    name: string;
  };
  assignments?: Array<{
    id: number;
    user: User;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  project: Project;
  taskStats: TaskStat[];
  recentTasks: Task[];
  userCount: number;
  groupCount: number;
}

export interface DashboardClientProps {
  dashboardData: DashboardStats;
  userProjects: Project[];
  userRole: string;
  userName: string;
  currentProjectId: number;
}
