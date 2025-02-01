#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { ConfigLoader } from "./utils/configLoader";
import { WorkTask } from "./tasks/workTask";
import { TaskConfig } from "./types";
import packageJson from "../package.json";
import { env } from "./utils/envConfig";
const program = new Command();

program
  .name("dev-bootstrap")
  .description(packageJson.description)
  .version(packageJson.version)
  .argument("<issueId>", "Issue ID")
  .option(
    "-c, --config <path>",
    "path to config file",
    "./src/config/default.wa-1"
  )
  .action(async (issueId: string, options: { config: string }) => {
    try {
      // Load and validate configuration and env vars
      // TODO not sure if I want to use class to load and validate config
      const configLoader = new ConfigLoader(path.resolve(options.config));
      const config: TaskConfig = configLoader.load();
      configLoader.validate();
      env.validate();

      // Execute tasks based on type
      switch (config.type) {
        case "work-task":
          const workTask = new WorkTask(config);
          await workTask.execute();
          break;
        default:
          console.error(`Unknown task type: ${config.type}`);
          process.exit(1);
      }
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

program.parse();
