import { fetchIssue, RawJiraIssue } from "../utils/jira";
import { env } from "../utils/envConfig";
import { BaseMetadata, TaskConfig } from "../types";
import { confirmProject, promptForProject } from "../utils/projectPrompt";
import { generateSlug, sanitizeSummary } from "../utils/prepareMetadata";

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

/*
  Map Jira issuetype names to one of the allowed types defined in the config.
*/
function createIssueType(issue: RawJiraIssue, config: TaskConfig): string {
  const type = issue.fields?.issuetype?.name?.toLowerCase();

  if (!type) {
    throw new Error("Issue type not found");
  }

  const mapping = config.taskTypeMapping;
  return mapping[type] || mapping.default || "chore";
}

/*
  Helper function: convertToStoryPoints
  Converts a Jira custom field value to a number representing story points.
  Adjust the custom field key (customfield_10016) as necessary.
*/
function convertToStoryPoints(customFieldValue: any): number {
  const points = Number(customFieldValue);
  return isNaN(points) ? 0 : points;
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

export function createLink(issueKey: string) {
  return `${env.get("JIRA_DOMAIN")}/browse/${issueKey}`;
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
  const jiraLink = createLink(issue.key);
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
