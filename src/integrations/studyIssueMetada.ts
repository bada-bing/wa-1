import { StudyTaskMetadata, TaskConfig } from "../types";
import { generateSlug } from "../utils/prepareMetadata";
import { promptForSource, confirmSource, promptForSummary, promptForInitiative, promptForObjective } from "../utils/sourcePrompt";

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
