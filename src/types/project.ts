// src/types/project.ts
export interface SimpleProject {
  id: number;
  name: string;
  description?: string;
  owner: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface Project extends SimpleProject {
  status: 'ACTIVE' | 'ARCHIVED' | string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: number;
}
