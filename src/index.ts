#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { ConfigLoader } from "./utils/configLoader";
import { WorkTask } from "./tasks/workTask";
import { TaskConfig } from "./types";
import packageJson from "../package.json";
import { env } from "./utils/envConfig";
import { fetchAndAdaptIssue } from "./integrations/jiraIssueAdapter";
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
      // TODO not sure if I want to use class to load and validate config
      const configLoader = new ConfigLoader(path.resolve(options.config));
      const config: TaskConfig = configLoader.load();
      configLoader.validate();
      env.validate();
      console.log(await getMyTeams())

      // Execute tasks based on type
      switch (config.type) {
        case "work-task":
          const workIssue = await fetchAndAdaptIssue(issueId, config);
          console.log("issue: ", workIssue);
          const workTask = new WorkTask(config, workIssue);
          await workTask.bootstrap();
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
