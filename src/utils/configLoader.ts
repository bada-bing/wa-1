import fs from "fs";
import Ajv from "ajv";
import { TaskConfig } from "../types";
import configSchema from "../config/schema.json";

export class ConfigLoader {
  private config: TaskConfig | null = null;
  private ajv: Ajv;

  constructor(private configPath: string) {
    this.ajv = new Ajv({ allErrors: true });
  }

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

    // Validate config against schema
    const validate = this.ajv.compile(configSchema);
    const valid = validate(this.config);

    if (!valid) {
      const errors = validate.errors
        ?.map((err) => {
          const path = err.instancePath || "root";
          return `  - ${path}: ${err.message}`;
        })
        .join("\n");

      throw new Error(`Configuration validation failed:\n${errors}`);
    }

    return true;
  }
}
