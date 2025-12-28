#!/usr/bin/env node
import "dotenv/config";

import { Command } from "commander";
import path from "path";
import { ConfigLoader } from "./utils/configLoader";
import { fetchAndAdaptIssue, WorkTask } from "./tasks/workTask";
import { StudyTask } from "./tasks/studyTask";
import { TaskConfig } from "./types";
import packageJson from "../package.json";
import { env } from "./utils/envConfig";
import { createStudyMetadata } from "./tasks/studyTask";
const program = new Command();

program
  .name("dev-bootstrap")
  .description(packageJson.description)
  .version(packageJson.version)
  .argument("<issueId>", "Issue ID")
  .option("-c, --config <path>", "path to task specific config file")
  .action(async (issueId: string, options: { config: string }) => {
    try {
      env.validate();

      // Automated task discovery
      const customConfigDir = env.get("WA_1_CONFIG_DIR");
      const configDir = customConfigDir
        ? path.resolve(customConfigDir)
        : path.resolve("src/config");

      console.debug(`[DEBUG] Using configuration directory: ${configDir}`);

      const configFiles = fs
        .readdirSync(configDir)
        .filter((file) => file.endsWith(".wa-1"));

      const discoveredTaskTypes: Record<
        string,
        { path: string; prefixes: string[] }
      > = {};

      for (const file of configFiles) {
        const filePath = path.join(configDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const partialConfig = JSON.parse(fileContent) as Partial<TaskConfig>;

        if (partialConfig.type && partialConfig.taskIdPrefix) {
          discoveredTaskTypes[partialConfig.type] = {
            path: filePath,
            prefixes: partialConfig.taskIdPrefix,
          };
        }
      }

      console.debug("[DEBUG] Automated Task Discovery:");

      const taskTypeMapping: Record<string, string> = {};
      const taskConfigPaths: Record<string, string> = {};
      for (const [type, { path, prefixes }] of Object.entries(
        discoveredTaskTypes
      )) {
        console.debug(`  - Task Type '${type}' found in '${path}'`);
        console.debug(`    - Mapped to prefixes: ${prefixes.join(", ")}`);
        taskConfigPaths[type] = path;
        for (const prefix of prefixes) {
          taskTypeMapping[prefix] = type;
        }
      }

      const guessedTaskType = guessTaskType(issueId, taskTypeMapping);
      const taskType = guessedTaskType
        ? await confirmTaskType(guessedTaskType)
        : await promptForTaskType();

      const taskSpecificConfigPath = options.config
        ? path.resolve(options.config)
        : taskConfigPaths[taskType];

      if (!taskSpecificConfigPath) {
        throw new Error(`No config path found for task type: ${taskType}`);
      }

      // TODO not sure if I want to use class to load and validate config
      const configLoader = new ConfigLoader(taskSpecificConfigPath);
      const config: TaskConfig = configLoader.load();
      configLoader.validate();

      // Execute tasks based on type
      switch (config.type) {
        case "work-task":
          const workIssue = await fetchAndAdaptIssue(issueId, config);
          const workTask = new WorkTask(config, workIssue);
          await workTask.bootstrap();
          break;
        case "study-task":
          const studyIssue = await createStudyMetadata(issueId, config);
          const studyTask = new StudyTask(config, studyIssue);
          await studyTask.bootstrap();
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
