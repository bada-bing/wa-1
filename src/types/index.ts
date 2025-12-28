export { CreateLinearIssueInput } from "./linear";

export interface VPNConfig {
  enabled: boolean;
  profile: string;
}

export interface ApplicationConfig {
  path: string;
  profile: string;
}

export interface Applications {
  browser: ApplicationConfig;
  [key: string]: ApplicationConfig;
}

// TODO ❓ instead of hardcoding use zod or similar to dynamically set the type
export interface TaskConfig {
  type: string;
  client?: string;
  project?: string;
  projects: string[];
  taskTypeMapping: Record<string, string>;
  projectMapping: {
    basedOnParent: Record<string, string>;
    basedOnJiraProject: Record<string, string | string[]>;
    basedOnLabels: Record<string, string>;
  };
  taskIdPrefix?: string[];
  vpn: {
    enabled: boolean;
    profile: string;
  };
  applications: {
    browser: {
      path: string;
      profile: string;
    };
  };
  logseq: {
    pagesPath: string;
  };
  linear?: {
    teamId?: string;
    teamKey?: string;
  };
  clockify?: {
    projectId: string;
  };
  remnote?: {
    exportPath: string;
  };
  studySources?: string[]; // e.g., ["exercism", "FM", "coursera", "other"]
  initiatives?: Record<string, string[]>; // e.g., { "10x": ["10x/domain-fe", "10x/domain-tools"] }
}

export enum TaskType {
  Work = "work-task",
  Study = "study-task",
  Operations = "operations-task",
}

export interface TaskExecutor {
  bootstrap(): Promise<void>;
}

// Base interface for all issue types
export interface BaseMetadata {
  key: string;
  summary: string;
  slug: string;
}

// Study task specific issue (extends base with study-related fields)
export interface StudyTaskMetadata extends BaseMetadata {
  source?: string; // e.g., "exercism", "coursera", etc.
  initiative?: string;
  objective?: string;
}
