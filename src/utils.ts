import { Issue } from "./jira";

export function generateBranchName(issue: Issue) {
  const issuetype = createIssueType(issue);
  const key = issue.key;
  const summary = createDashedSummary(issue);

  return `${issuetype}/${key}/${summary}`;
}

/*
 * A string which can be used as a part of the branch name or for the file name
 * TODO Confirm: I believe that this is called slug in web development
 */
export function createDashedSummary(issue: Issue) {
  let summary = issue.fields.summary;
  summary = summary.toLowerCase();

  summary = summary.replace(/\s/g, "-"); // \s as a whitespace characters
  summary = summary.replace(/\//g, "_");
  // reduce the number of words, i.e., remove the noise
  summary = summary.replace("shopping-cart", "cart");
  summary = summary.replace(/-the-/g, "-");
  return summary;
}

// being more specific about the issue type would give better statistics
// I could analyse based on the number of branches what kind of tasks are most common
export function createIssueType(issue: Issue) {
  const issuetype = issue.fields.issuetype.name;

  switch (issuetype.toLowerCase()) {
    case "task":
      return "task";
    case "bug":
      return "bugfix"; // it could be 'task'
    case "spike":
      return "prototype";
    case "improvement":
      return "improvement"; // it could be 'task'
    case "story":
      return "feature";
    default:
      return "feature";
  }
}

export function determineProject(issue: Issue) {
  // it is possible that parent is not set
  const parent = issue.fields.parent?.key || "";

  switch (parent) {
    case process.env.MAIN_PROJECT_JIRA_ISSUE:
      return process.env.MAIN_PROJECT;
    case process.env.SECOND_PROJECT_JIRA_ISSUE:
      return process.env.SECOND_PROJECT;
    default:
      return process.env.MAIN_PROJECT;
  }
}

export function createLink(issueKey: string) {
  return `${process.env.JIRA_DOMAIN}/browse/${issueKey}`;
}
