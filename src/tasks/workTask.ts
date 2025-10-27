import { AdaptedIssue } from "../integrations/jiraIssueAdapter";
import { adaptWorkIssueToLinear } from "../integrations/linearIssueAdapter";
import { TaskConfig, TaskExecutor } from "../types";
import { executeGitProcedure } from "../utils/git";
import { executeLogseqProcedure } from "../logseq";
import { executeLinearProcedure } from "../utils/linear";
import { createClockifyTask } from "../clockify";

export class WorkTask implements TaskExecutor {
  constructor(private config: TaskConfig, private issue: AdaptedIssue) {
    if (!config.project || !issue.project) {
      throw new Error("Project is required");
    }
  }

  async bootstrap(): Promise<void> {
    try {
      await executeGitProcedure(this.issue, this.config);
      await executeLogseqProcedure(this.issue, this.config);
      
      // Adapt work issue to Linear format, then execute
      const linearInput = await adaptWorkIssueToLinear(this.issue, {
        id: this.config.linear?.teamId,
        key: this.config.linear?.teamKey,
      });
      await executeLinearProcedure(linearInput);
      
      await createClockifyTask(
        { key: this.issue.key },
        this.config.clockify?.projectId
      );

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

  private async openApplications(): Promise<void> {
    // TODO Implement application launching logic
    console.log("Opening required applications...");
  }
}
