import { BaseMetadata, CreateLinearIssueInput, TaskConfig, TaskExecutor } from "../types";
import { executeGitProcedure } from "../utils/git";
import { executeLogseqProcedure } from "../integrations/logseq/LogseqService";
import { createLinearIssue } from "../integrations/linear/LinearClient";
import { createClockifyTask } from "../integrations/clockify/ClockifyClient";
import { convertToStoryPoints, createIssueType, fetchIssue, RawJiraIssue } from "../integrations/jira/JiraClient";
import { generateSlug, generateJiraLink, sanitizeSummary } from "../utils/prepareMetadata";
import { confirmProject, promptForProject } from "../utils/projectPrompt";
import { adaptTaskToLinear } from "../adapters/linear/BaseLinearAdapter";

// Work task specific issue (extends base with Jira-related fields)
export interface AdaptedIssue extends BaseMetadata {
  key: string;
  summary: string;
  project: string;
  branchName: string;
  issueType: string;
  jiraLink: string;
  storyPoints: number;
  slug: string;
}

export class WorkTask implements TaskExecutor {
  constructor(private config: TaskConfig, private issue: AdaptedIssue) {
    if (!config.project || !issue.project) {
      throw new Error("Project is required");
    }
  }

  async bootstrap(): Promise<void> {
    try {
      await executeGitProcedure(this.issue, this.config);

      // Prepare template data for LogSeq
      await executeLogseqProcedure(
        this.issue.slug,
        `logseq.${this.config.type}.template.md`,
        {
          jira: {
            issue: this.issue.key,
            url: this.issue.jiraLink,
          },
          project: this.issue.project,
          branch_name: this.issue.branchName,
          summary: this.issue.summary,
          slug: this.issue.slug,
          issue_type: this.issue.issueType,
        },
        this.config
      );

      // Adapt work issue to Linear format, then execute
      const linearInput = await adaptWorkIssueToLinear(this.issue, {
        id: this.config.linear?.teamId,
        key: this.config.linear?.teamKey,
      },
      this.config.client || ""
    );
      await createLinearIssue(linearInput);

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

/*
  Work-specific adapter: converts AdaptedIssue (from Jira) to LinearIssueInput
*/
export async function adaptWorkIssueToLinear(
  issue: AdaptedIssue,
  teamConfig: { id?: string; key?: string },
  projectName: string
): Promise<CreateLinearIssueInput> {
  const links = {
    jira: issue.jiraLink,
    gitlab: "#", // TODO: issue.gitlabLink,
    logseq: `logseq://graph/kb_logseq?page=${issue.slug}`,
    clockify: "#", // TODO: issue.clockifyLink,
  };

  const additionalFields: Partial<CreateLinearIssueInput> = {};
  if (issue.storyPoints) {
    additionalFields.estimate = setEstimate(issue.storyPoints);
  }

  return adaptTaskToLinear(
    issue.key,
    issue.summary,
    issue.slug,
    "✨",
    links,
    teamConfig,
    projectName,
    additionalFields
  );
}

function setEstimate(storyPoints: number): number {
  // estimate; 1 - xs, 2 -s, 3 - m, 5 - l , 8 - xl
  // no value is set for the "no estimate"
  if (storyPoints <= 2) {
    return 1;
  } else if (storyPoints <= 5) {
    return 2;
  } else if (storyPoints <= 8) {
    return 3;
  } else if (storyPoints <= 13) {
    return 5;
  } else {
    return 8;
  }
}

/*
  The adapter function: fetchAndAdaptIssue
  This function fetches the issue using fetchIssue and then extends it with the needed Git-related information,
  which can be used later in our git procedures.
*/
export async function fetchAndAdaptIssue(
  issueKey: string,
  config: TaskConfig
): Promise<AdaptedIssue> {
  const issue = await fetchIssue(issueKey);

  let project = determineProject(issue, config);

  if (!project) {
    // If project couldn't be determined, prompt the user
    project = await promptForProject(issue.id, config);
  } else {
    // If project was determined automatically, confirm with user
    project = await confirmProject(issue.id, project, config);
  }

  const branchName = generateBranchName(issue, config);
  // TODO consider to separate the issue type from the prefix of the branch name
  // I use the issue type for more than just the prefix of the branch name (e.g., in logseq)
  const issueType = createIssueType(issue, config);
  const jiraLink = generateJiraLink(issue.key);
  const slug = generateSlug(issue.key, issue.fields.summary);

  return {
    key: issue.key,
    summary: issue.fields.summary,
    project,
    branchName,
    issueType,
    jiraLink,
    slug,
    storyPoints: convertToStoryPoints(issue.fields.customfield_10008),
  };
}

// Use multiple strategies to determine the project: parent and jira project mapping, extract summary keywords
export function determineProject(
  issue: RawJiraIssue,
  config: TaskConfig
): string | null {
  // Strategy 1: Check parent issue mapping
  const parent = issue.fields.parent?.key;
  if (parent && config.projectMapping.basedOnParent[parent]) {
    return config.projectMapping.basedOnParent[parent];
  }

  // Strategy 2: Check Jira project mapping
  const jiraProjectKey = issue.fields.project.key;

  if (config.projectMapping.basedOnJiraProject[jiraProjectKey]) {
    const mapped = config.projectMapping.basedOnJiraProject[jiraProjectKey];
    // If it's a single string, return it
    if (typeof mapped === "string") {
      return mapped;
    }
    // If it's an array with one item, return it
    if (Array.isArray(mapped) && mapped.length === 1) {
      return mapped[0];
    }
    // If it's an array with multiple items, we can't automatically determine
    // Return null to trigger user prompt
    // TODO in future open prompt with elements from the array
  }

  // Strategy 3: Check labels mapping
  if (issue.fields.labels && issue.fields.labels.length > 0) {
    const issueLabels = issue.fields.labels.map((label) => label.toLowerCase());
    for (const [labelKey, project] of Object.entries(
      config.projectMapping.basedOnLabels || {}
    )) {
      if (issueLabels.includes(labelKey.toLowerCase())) {
        // Verify this project exists in the config
        if (config.projects.includes(project)) {
          return project;
        }
      }
    }
  }

  // Strategy 4: Check summary for project keywords
  const summary = issue.fields.summary.toLowerCase();
  const summaryKeywords: Record<string, string[]> = {
    "cart-ui-next": [
      "cart_ui_next",
      "cart-ui-next",
      "cart ui next",
      "shopping_cart",
    ],
    "shopping-profile-ui": [
      "shopping_profile",
      "shopping-profile",
      "profile ui",
    ],
    "form-generator": ["form_generator", "form-generator", "form generator"],
  };

  for (const [project, keywords] of Object.entries(summaryKeywords)) {
    if (keywords.some((keyword) => summary.includes(keyword))) {
      // Verify this project exists in the config
      if (config.projects.includes(project)) {
        return project;
      }
    }
  }

  // Strategy 5: Use default from parent mapping
  if (config.projectMapping.basedOnParent["default"]) {
    return config.projectMapping.basedOnParent["default"];
  }

  // No project could be determined
  return null;
}

/*
  Helper function: generateBranchName
  Create a branch name based on the issue key and a sanitized version of its summary.
  Use the issue key and summary for the branch name.
*/
function generateBranchName(issue: RawJiraIssue, config: TaskConfig): string {
  const issuetype = createIssueType(issue, config);

  const summary = sanitizeSummary(issue.fields.summary);

  return `${issuetype}/${issue.key.toLowerCase()}/${summary.toLowerCase()}`;
}