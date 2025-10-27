import { StudyTaskMetadata, TaskConfig, TaskExecutor } from "../types";
import { adaptStudyIssueToLinear } from "../integrations/linearIssueAdapter";
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
      // await executeLogseqProcedure(this.studyTaskMetadata, this.config);
      
      // Adapt study task to Linear format, then execute
      const linearInput = await adaptStudyIssueToLinear(this.studyTaskMetadata, {
        id: this.config.linear?.teamId,
        key: this.config.linear?.teamKey,
      });
      console.log("input", linearInput)
      // await executeLinearProcedure(linearInput);
      
      // Create Clockify task in study project
      // await createClockifyTask(
      //   { key: this.studyTaskMetadata.key },
      //   this.config.clockify?.projectId
      // );

      // Create RemNote markdown file for import
    //   await executeRemNoteProcedure(this.studyTaskMetadata, this.config);

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
    // TODO I believe that this application could simply call WA-2
    console.log("Opening required applications...");
  }
}
