import inquirer from "inquirer";
import { TaskConfig } from "../types";

// Prompt user to select or enter a project if missing
export async function promptForProject(
  issueId: string,
  config: TaskConfig
): Promise<string> {
  const projectChoices = config.projects || [];
  
  if (projectChoices.length > 0) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "selectedProject",
        message: `Unable to determine project for issue ${issueId}. Please select a project:`,
        choices: projectChoices,
      } as any,
    ]);
    return answer.selectedProject;
  } else {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "selectedProject",
        message: `Unable to determine project for issue ${issueId}. Please enter a project name:`,
      },
    ]);
    return answer.selectedProject;
  }
}

// Confirm the determined project with the user
export async function confirmProject(
  issueId: string,
  project: string,
  config: TaskConfig
): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "isCorrect",
      message: `Determined project for issue ${issueId} is "${project}". Is this correct?`,
      default: true,
    },
  ]);

  if (answer.isCorrect) {
    return project;
  } else {
    // If user says no, prompt them to select a different project
    return promptForProject(issueId, config);
  }
}
