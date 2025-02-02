import { AdaptedIssue } from "../integrations/jiraIssueAdapter";
import { TaskConfig, TaskExecutor } from "../types";
import { executeGitProcedure } from "../utils/git";
import { executeLogseqProcedure } from "../logseq";

export class WorkTask implements TaskExecutor {
  constructor(private config: TaskConfig, private issue: AdaptedIssue) {
    if (!config.project || !issue.project) {
      throw new Error("Project is required");
    }
  }

  async bootstrap(): Promise<void> {
    try {
      executeGitProcedure(this.issue);

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
