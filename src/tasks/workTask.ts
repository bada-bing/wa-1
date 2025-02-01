import { TaskConfig, TaskExecutor } from "../types";
import { getCurrentBranch, isValidRepository } from "../utils/git";

export class WorkTask implements TaskExecutor {
  constructor(private config: TaskConfig) {
    if (!config.project) {
      throw new Error("Project is required in configuration");
    }
  }

  async bootstrap(): Promise<void> {
    try {
      const isValid = await isValidRepository(this.config.project);
      if (!isValid) {
        throw new Error(
          `Invalid git repository for project: ${this.config.project}`
        );
      }

      const currentBranch = await getCurrentBranch(this.config.project);
      console.log(`Current branch: ${currentBranch}`);

      if (this.config.vpn?.enabled) {
        await this.connectVPN();
      }

      await this.openApplications(); // TODO I could do this after I bootstrap the task

      console.log("Work environment setup completed!");
    } catch (error) {
      throw new Error(
        `Failed to execute work task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async connectVPN(): Promise<void> {
    // TODO Implement VPN connection logic
    console.log("Connecting to VPN...");
  }

  private async openApplications(): Promise<void> {
    // TODO Implement application launching logic
    console.log("Opening required applications...");
  }
}
