import { StudyTaskMetadata, TaskConfig, TaskExecutor } from "../types";
import { executeLogseqProcedure } from "../logseq";
import { executeLinearProcedure } from "../utils/linear";
import { createClockifyTask } from "../clockify";
import { executeRemNoteProcedure } from "../remnote";

export class StudyTask implements TaskExecutor {
  constructor(private config: TaskConfig, private studyTaskMetadata: StudyTaskMetadata) {}

  async bootstrap(): Promise<void> {
    try {
      // Skip git procedure for study tasks
      
      // Create LogSeq page
      await executeLogseqProcedure(this.studyTaskMetadata, this.config);
      
      // Create Linear issue with study team
    //   await executeLinearProcedure(this.issue, this.config.linear?.teamId);
      
      // Create Clockify task in study project
      // await createClockifyTask(
      //   { key: this.issue.key },
      //   this.config.clockify?.projectId
      // );

      // Create RemNote markdown file for import
    //   await executeRemNoteProcedure(this.issue, this.config);

      await this.openApplications();

      console.log("Study environment setup completed!");
    } catch (error) {
      throw new Error(
        `Failed to execute study task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async openApplications(): Promise<void> {
    // TODO Implement application launching logic for study tasks
    console.log("Opening required applications...");
  }
}
