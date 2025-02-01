import fs from "fs";
import { TaskConfig } from "../types";

export class ConfigLoader {
  private config: TaskConfig | null = null;

  constructor(private configPath: string) {}

  load(): TaskConfig {
    try {
      const rawConfig = fs.readFileSync(this.configPath, "utf8");
      this.config = JSON.parse(rawConfig) as TaskConfig;
      return this.config;
    } catch (error) {
      throw new Error(
        `Failed to load configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  validate(): boolean {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    if (!this.config.type) {
      throw new Error('Configuration must specify a "type" property');
    }

    // Add more validation as needed
    return true;
  }
}
