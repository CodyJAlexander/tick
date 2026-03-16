export interface Client {
  id: number;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  name: string;
  clientId?: number;
}

export interface Entry {
  id: number;
  task: string;
  clientId?: number;
  projectId?: number;
  startedAt: string;
  stoppedAt?: string;
  googleEventId?: string;
  outlookEventId?: string;
  syncPending: boolean;
  createdAt: string;
}

export interface StopEntryInput {
  id: number;
  task: string;
  clientId?: number;
  projectId?: number;
  stoppedAt: string;
}

export interface UpdateEntryInput {
  id: number;
  task: string;
  clientId?: number;
  projectId?: number;
  startedAt: string;
  stoppedAt: string;
}
