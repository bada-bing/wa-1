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

export interface TaskConfig {
  type: string;
  project: string;
  taskTypeMapping: Record<string, string>;
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
}

export interface TaskExecutor {
  bootstrap(): Promise<void>;
}
