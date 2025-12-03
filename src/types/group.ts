// src/types/group.ts
export interface Group {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  createdAt?: Date;
  updatedAt?: Date;
}
