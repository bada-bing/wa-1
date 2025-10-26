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
  project: string;
  projects: string[];
  taskTypeMapping: Record<string, string>;
  projectMapping: {
    basedOnParent: Record<string, string>;
    basedOnJiraProject: Record<string, string | string[]>;
    basedOnLabels: Record<string, string>;
  };
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
    teamId: string;
  };
  clockify?: {
    projectId: string;
  };
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
