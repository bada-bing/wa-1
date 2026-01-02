import inquirer from "inquirer";
import { TaskConfig } from "../types";

// Prompt user to optionally provide a summary
export async function promptForSummary(taskId: string): Promise<string | undefined> {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "summary",
      message: `Enter a summary for task ${taskId} (press Enter to skip):`,
      default: "",
    },
  ]);
  
  return answer.summary.trim() || undefined;
}

// Prompt user to select or enter a source if missing
export async function promptForSource(
  taskId: string,
  config: TaskConfig
): Promise<string> {
  const sourceChoices = config.studySources || [];
  
  if (sourceChoices.length > 0) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSource",
        message: `Please select a source for task ${taskId}:`,
        choices: sourceChoices,
      } as any,
    ]);
    return answer.selectedSource;
  } else {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "selectedSource",
        message: `Please enter a source for task ${taskId}:`,
        default: "manual",
      },
    ]);
    return answer.selectedSource;
  }
}

// Confirm the source with the user
export async function confirmSource(
  taskId: string,
  source: string,
  config: TaskConfig
): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "isCorrect",
      message: `Source for task ${taskId} is "${source}". Is this correct?`,
      default: true,
    },
  ]);

  if (answer.isCorrect) {
    return source;
  } else {
    // If user says no, prompt them to select a different source
    return promptForSource(taskId, config);
  }
}

// Prompt user to select an initiative
export async function promptForInitiative(
  taskId: string,
  config: TaskConfig
): Promise<string> {
  const initiatives = config.initiatives || {};
  const initiativeKeys = Object.keys(initiatives);
  
  if (initiativeKeys.length === 0) {
    throw new Error("No initiatives configured in config file");
  }
  
  if (initiativeKeys.length === 1) {
    // Auto-select if only one initiative exists
    return initiativeKeys[0];
  }
  
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "initiative",
      message: `Select an initiative for task ${taskId}:`,
      choices: initiativeKeys,
    } as any,
  ]);
  
  return answer.initiative;
}

// Prompt user to select an objective from the chosen initiative
export async function promptForObjective(
  taskId: string,
  initiative: string,
  config: TaskConfig
): Promise<string> {
  const objectives = config.initiatives?.[initiative] || [];
  
  if (objectives.length === 0) {
    throw new Error(`No objectives configured for initiative "${initiative}"`);
  }
  
  if (objectives.length === 1) {
    // Auto-select if only one objective exists
    return objectives[0];
  }
  
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "objective",
      message: `Select an objective for task ${taskId} (initiative: ${initiative}):`,
      choices: objectives,
    } as any,
  ]);
  
  return answer.objective;
}
