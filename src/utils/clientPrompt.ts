import inquirer from "inquirer";
import { TaskConfig } from "../types";

export async function promptForClient(config: TaskConfig): Promise<string> {
  if (!config.clients) {
    throw new Error("No clients defined in the configuration.");
  }
  const clientChoices = Object.keys(config.clients);

  if (clientChoices.length === 0) {
    throw new Error("No clients defined in the configuration.");
  }

  // If there's only one client, automatically select it
  if (clientChoices.length === 1) {
    console.log(`✔ Automatically selected client: ${clientChoices[0]}`);
    return clientChoices[0];
  }

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedClient",
      message: "Please select a client:",
      choices: clientChoices,
    },
  ]);
  return answer.selectedClient;
}
