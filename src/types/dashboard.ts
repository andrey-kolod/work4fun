// src/types/dashboard.ts
import { Task } from './task';
import { SimpleProject } from './project';

export interface TaskStat {
  status: string;
  count: number;
}

export interface DashboardStats {
  taskStats: TaskStat[];
  recentTasks: Task[];
  userCount: number;
  groupCount: number;
  project?: SimpleProject;
}

export interface DashboardClientProps {
  dashboardData: DashboardStats;
  userProjects: SimpleProject[];
  userRole: string;
  userName: string;
  currentProjectId: number;
}
