import { BaseMetadata, ClientConfig, TaskConfig, TaskExecutor } from "../types";
import { executeGitProcedure } from "../utils/git";
import { executeLogseqProcedure } from "../integrations/logseq/LogseqService";
import {
  convertToStoryPoints,
  createIssueType,
  fetchIssue,
  RawJiraIssue,
} from "../integrations/jira/JiraClient";
import {
  generateSlug,
  generateJiraLink,
  sanitizeSummary,
} from "../utils/prepareMetadata";
import { confirmProject, promptForProject } from "../utils/projectPrompt";
import { promises as fs } from "fs";
import * as path from "path";

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
  private clientConfig: ClientConfig;

  constructor(
    private config: TaskConfig,
    private issue: AdaptedIssue,
    private activeClient: string
  ) {
    if (!config.clients) {
      throw new Error("Clients configuration not found for work task.");
    }
    this.clientConfig = config.clients[activeClient];
    if (!this.clientConfig || !issue.project) {
      throw new Error("Project is required");
    }
  }

  async bootstrap(): Promise<void> {
    try {
      await executeGitProcedure(this.issue, this.config);

      const checklistTemplate = await fs.readFile(
        path.resolve(
          process.cwd(),
          "src/templates/work-task-checklist.template.md"
        ),
        "utf-8"
      );

      const indentedChecklist = checklistTemplate
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");

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
          action_items: indentedChecklist,
          estimated_effort: setEstimate(this.issue.storyPoints),
          client: this.activeClient.toUpperCase(),
        },
        this.config
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
  config: TaskConfig,
  activeClient?: string
): Promise<AdaptedIssue> {
  if (!activeClient) {
    throw new Error("Active client is required for work tasks.");
  }
  if (!config.clients) {
    throw new Error("Clients configuration not found for work task.");
  }
  const clientConfig = config.clients[activeClient];
  if (!clientConfig) {
    throw new Error(
      `Client configuration not found for active client: ${activeClient}`
    );
  }

  const issue = await fetchIssue(issueKey);

  let project = determineProject(issue, clientConfig);

  if (!project) {
    // If project couldn't be determined, prompt the user
    project = await promptForProject(issueKey, clientConfig.projects);
  } else {
    // If project was determined automatically, confirm with user
    project = await confirmProject(issueKey, project, clientConfig.projects);
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
  clientConfig: ClientConfig
): string | null {
  // Strategy 1: Check parent issue mapping
  const parent = issue.fields.parent?.key;
  if (parent && clientConfig.projectMapping.basedOnParent[parent]) {
    return clientConfig.projectMapping.basedOnParent[parent];
  }

  // Strategy 2: Check Jira project mapping
  const jiraProjectKey = issue.fields.project.key;

  if (clientConfig.projectMapping.basedOnJiraProject[jiraProjectKey]) {
    const mapped =
      clientConfig.projectMapping.basedOnJiraProject[jiraProjectKey];
    // If it's a single string, return it
    if (typeof mapped === "string") {
      return mapped;
    }
    // If it's an array, return null if there's more than one option (requires user prompt), otherwise return the first item
    if (Array.isArray(mapped)) {
      if (mapped.length > 1) {
        return null;
      }
      return mapped[0];
    }
  }

  // Strategy 3: Check labels mapping
  if (issue.fields.labels && issue.fields.labels.length > 0) {
    const issueLabels = issue.fields.labels.map((label) => label.toLowerCase());
    for (const [labelKey, project] of Object.entries(
      clientConfig.projectMapping.basedOnLabels || {}
    )) {
      if (issueLabels.includes(labelKey.toLowerCase())) {
        // Verify this project exists in the config
        if (clientConfig.projects.includes(project)) {
          return project;
        }
      }
    }
  }

  // Strategy 4: Check summary for project keywords
  const summary = issue.fields.summary.toLowerCase();
  const summaryKeywords = clientConfig.projectMapping.basedOnSummaryKeywords || {};

  for (const [project, keywords] of Object.entries(summaryKeywords)) {
    if (keywords.some((keyword) => summary.includes(keyword))) {
      // Verify this project exists in the config
      if (clientConfig.projects.includes(project)) {
        return project;
      }
    }
  }

  // Strategy 5: Use default from parent mapping
  if (clientConfig.projectMapping.basedOnParent["default"]) {
    return clientConfig.projectMapping.basedOnParent["default"];
  }

  // No project could be determined
  return null;
}

/*
  Helper function: generateBranchName
  Create a branch name based on the issue key and a sanitized version of its summary.
  Use the issue key and summary for the branch name.
*/
export function generateBranchName(
  issue: RawJiraIssue,
  config: TaskConfig
): string {
  const issuetype = createIssueType(issue, config);

  const summary = sanitizeSummary(issue.fields.summary);

  return `${issuetype}/${issue.key.toLowerCase()}/${summary.toLowerCase()}`;
}
