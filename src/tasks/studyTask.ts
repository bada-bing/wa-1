import { CreateLinearIssueInput, StudyTaskMetadata, TaskConfig, TaskExecutor } from "../types";
import { generateSlug } from "../utils/prepareMetadata";
import { promptForSource, confirmSource, promptForSummary, promptForInitiative, promptForObjective } from "../utils/sourcePrompt";
import { createLinearIssue } from "../integrations/linear/LinearClient";
import { adaptTaskToLinear } from "../adapters/linear/BaseLinearAdapter";

export class StudyTask implements TaskExecutor {
  constructor(private config: TaskConfig, private studyTaskMetadata: StudyTaskMetadata) {}

  async bootstrap(): Promise<void> {
    try {
      // Skip git procedure for study tasks

      // Create LogSeq page
      // await executeLogseqProcedure(
      //   this.studyTaskMetadata.slug,
      //   `logseq.${this.config.type}.template.md`,
      //   {
      //     key: this.studyTaskMetadata.key,
      //     summary: this.studyTaskMetadata.summary,
      //     slug: this.studyTaskMetadata.slug,
      //     source: this.studyTaskMetadata.source || "manual",
      //     initiative: this.studyTaskMetadata.initiative || "",
      //     objective: this.studyTaskMetadata.objective || "",
      //   },
      //   this.config
      // );

      // TODO executeLinearProcedure (should wrap around 'adaptStudyIssueToLinear' and 'createLinearIssue')

      // Adapt study task to Linear format, then execute
      const linearInput = await adaptStudyIssueToLinear(this.studyTaskMetadata, {
        id: this.config.linear?.teamId,
        key: this.config.linear?.teamKey,
      });

      await createLinearIssue(linearInput);

      // Create Clockify task in study project
      // await createClockifyTask(
      //   { key: this.studyTaskMetadata.key },
      //   this.config.clockify?.projectId
      // );

      // Create RemNote markdown file for import (note: RemNoteIssueData is for work tasks)
      // await executeRemNoteProcedure(this.studyTaskMetadata, this.config);

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

/**
 * Create study task metadata from a simple identifier
 * For study tasks, we don't fetch from Jira, instead we create a simple metadata structure
 */
export async function createStudyMetadata(
  taskId: string,
  config: TaskConfig,
  options?: Partial<StudyTaskMetadata>
): Promise<StudyTaskMetadata> {
  const sanitizedId = taskId.toLowerCase().replace(/[^a-z0-9\s-]+/g, "-");
  
  // Determine source: use provided option, or auto-detect from taskId, or prompt user
  let source = options?.source;
  
  if (!source) {
    // Try to auto-detect source from taskId
    const detectedSource = determineSourceFromTaskId(taskId, config);
    
    if (detectedSource) {
      // If source was auto-detected, confirm with user
      source = await confirmSource(taskId, detectedSource, config);
    } else {
      // If source couldn't be determined, prompt the user
      source = await promptForSource(taskId, config);
    }
  } else if (config.studySources && config.studySources.length > 0) {
    // If source was provided in options, confirm with user
    source = await confirmSource(taskId, source, config);
  }
  
  const summary = options?.summary || (await promptForSummary(taskId)) || taskId;

  // Determine initiative and objective
  let initiative = options?.initiative;
  let objective = options?.objective;
  
  if (!initiative) {
    // Prompt for initiative (auto-selects if only one exists)
    initiative = await promptForInitiative(taskId, config);
  }
  
  if (!objective) {
    // Prompt for objective (auto-selects if only one exists for the initiative)
    objective = await promptForObjective(taskId, initiative, config);
  }

  return {
    key: taskId,
    summary,
    slug: options?.slug || generateSlug(taskId, summary),
    source: source || "manual",
    initiative,
    objective,
  };
}

/**
 * Determine the source based on taskId prefix matching configured sources
 * Returns the matched source or null if no match found
 */
function determineSourceFromTaskId(
  taskId: string,
  config: TaskConfig
): string | null {
  if (!config.studySources || config.studySources.length === 0) {
    return null;
  }

  const taskIdUpper = taskId.toUpperCase();
  
  // Check if taskId starts with any of the configured sources
  for (const source of config.studySources) {
    const sourceUpper = source.toUpperCase();
    // Check for patterns like "FM-1", "FM_1", "FM1", or just "FM"
    if (
      taskIdUpper.startsWith(sourceUpper + "-") ||
      taskIdUpper.startsWith(sourceUpper + "_") ||
      taskIdUpper.startsWith(sourceUpper) && /^\d/.test(taskId.substring(source.length))
    ) {
      return source;
    }
  }

  return null;
}

// TODO move this method to StudyTask (and similarly for WorkTask)
// TODO rename to prepareDataForLinear (or createLinearIssueInput)
/*
  Study-specific adapter: converts StudyTaskMetadata to LinearIssueInput
*/
export async function adaptStudyIssueToLinear(
  studyTask: StudyTaskMetadata,
  teamConfig: { id?: string; key?: string }
): Promise<CreateLinearIssueInput> {
  const links = {
    logseq: `logseq://graph/kb_logseq?page=${studyTask.slug}`,
    source: studyTask.source || "manual",
    initiative: studyTask.initiative || "N/A",
    objective: studyTask.objective || "N/A",
  };

  // TODO state, prirority and estimates are missing!
  // TODO you should check if the linear issue with the same id already exists (e.g., FM-2) and suggest the next possible
  const additionalFields: Partial<CreateLinearIssueInput> = {
    priority: 0,
    // Study tasks typically don't have estimates initially
  };

  return adaptTaskToLinear(
    studyTask.key,
    studyTask.summary,
    studyTask.slug,
    "📚",
    links,
    teamConfig,
    studyTask.objective || "",
    additionalFields
  );
}