import { fetchIssue, RawJiraIssue } from "../utils/jira";
import { env } from "../utils/envConfig";
import { TaskConfig } from "../types";

export interface AdaptedIssue {
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
 * A string which can be used as a part of the branch name or for the file name
 */
export function createSanitizedSummary(issue: RawJiraIssue) {
  let summary = issue.fields.summary
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, "-") // replace non-alphanumeric characters with dashes
    .replace(/\s/g, "_")
    .replace(/^-|-$/g, "");

  // TODO reducing of words should be specified in the config
  // TODO considering that the summary is sanitized before removing the words, I should remove the noise before (because sanitization changes the words)
  // remove the noise, i.e., reduce the number of words
  summary = summary.replace(/shopping_cart/g, "cart");
  summary = summary.replace(/_the_/g, "-");

  return summary;
}

// title of logseq page (and potentially the linear issue and raindrop title)
function generateSlug(issue: RawJiraIssue): string {
  const summary = createSanitizedSummary(issue);
  return `${issue.key}-${summary}`;
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

  const summary = createSanitizedSummary(issue);

  return `${issuetype}/${issue.key.toLowerCase()}/${summary.toLowerCase()}`;
}

// based on the parent issue, determine the project
export function determineProject(issue: RawJiraIssue): string {
  // it is possible that parent is not set
  // TODO throw error or decide how to handle this
  const parent = issue.fields.parent?.key || "";

  switch (parent) {
    case process.env.MAIN_PROJECT_JIRA_ISSUE:
      return process.env.MAIN_PROJECT || "";
    case process.env.SECOND_PROJECT_JIRA_ISSUE:
      return process.env.SECOND_PROJECT || "";
    default:
      return process.env.MAIN_PROJECT || "";
  }
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

  const project = determineProject(issue);
  const branchName = generateBranchName(issue, config);
  // TODO consider to separate the issue type from the prefix of the branch name
  // I use the issue type for more than just the prefix of the branch name (e.g., in logseq)
  const issueType = createIssueType(issue, config);
  const jiraLink = createLink(issue.key);
  const slug = generateSlug(issue);

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
