import inquirer from "inquirer";
import { TaskType } from "../types";

export function guessTaskType(
  issueId: string,
  taskTypeMapping: Record<string, string>
): TaskType | null {
  if (!taskTypeMapping) {
    return null;
  }

  for (const prefix in taskTypeMapping) {
    if (issueId.startsWith(prefix)) {
      const taskType = taskTypeMapping[prefix] as TaskType;
      // Small validation to make sure the mapping is correct
      if (Object.values(TaskType).includes(taskType)) {
        return taskType;
      }
    }
  }

  return null;
}

export async function promptForTaskType(): Promise<TaskType> {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedTaskType",
      message: "Please select the task type:",
      choices: Object.values(TaskType),
    },
  ]);
  return answer.selectedTaskType;
}

export async function confirmTaskType(
  guessedType: TaskType
): Promise<TaskType> {
  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "isCorrect",
      message: `Guessed task type is "${guessedType}". Is this correct?`,
      default: true,
    },
  ]);

  if (answer.isCorrect) {
    return guessedType;
  } else {
    return promptForTaskType();
  }
}
