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
  taskTypeMapping: {
    [key: string]: string;
  };
  vpn?: VPNConfig;
  applications?: Applications;
}

export interface TaskExecutor {
  bootstrap(): Promise<void>;
}
