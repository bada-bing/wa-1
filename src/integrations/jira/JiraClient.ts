import { TaskConfig } from "../../types";
import { env } from "../../utils/envConfig";

// TODO this type is somewhat domain specific, should be read from the JSON config
export type RawJiraIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: { type: string; version: number; content: any[] };
    issuetype: {
      id: string;
      name: string;
      subtask: boolean;
      hierarchyLevel: number;
    };
    parent?: {
      key: string;
    };
    project: {
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
    };
    status: {
      id: string;
      name: string;
      description: string;
      statusCategory: {
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority: {
      id: string;
      name: string;
    };
    assignee: {
      accountId: string;
      displayName: string;
      emailAddress: string;
      active: boolean;
    } | null;
    created: string;
    updated: string;
    resolutiondate: string | null;
    resolution: any | null;
    labels: string[];
    duedate: string | null;
    timetracking: {
      originalEstimate?: string;
      remainingEstimate?: string;
      timeSpent?: string;
    };
    customfield_10008: number | null; // Story Points
    subtasks: any[];
    issuelinks: any[];
    lastViewed?: string;
  };
};

interface JiraConfig {
  email: string;
  apiToken: string;
  jiraDomain: string;
}

// Fetches a Jira issue using the Jira API.
export async function fetchIssue(issueKey: string): Promise<RawJiraIssue> {
  if (!issueKey) {
    throw new Error("Issue key is required");
  }

  const config: JiraConfig = {
    email: env.get("JIRA_USER"),
    apiToken: env.get("JIRA_API_TOKEN"),
    jiraDomain: env.get("JIRA_DOMAIN"),
  };

  if (!config.jiraDomain || !config.email || !config.apiToken) {
    throw new Error(
      "Invalid Jira configuration: email, apiToken, and jiraDomain are required"
    );
  }

  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
    "base64"
  );

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  const url = `${config.jiraDomain}/rest/api/3/issue/${issueKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch issue: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as RawJiraIssue;
  } catch (error) {
    throw new Error(
      `Error fetching Jira issue ${issueKey}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/*
  Helper function: convertToStoryPoints
  Converts a Jira custom field value to a number representing story points.
  Adjust the custom field key (customfield_10016) as necessary.
*/
export function convertToStoryPoints(customFieldValue: any): number {
  const points = Number(customFieldValue);
  return isNaN(points) ? 0 : points;
}

/*
  Map Jira issuetype names to one of the allowed types defined in the config.
*/
export function createIssueType(
  issue: RawJiraIssue,
  config: TaskConfig
): string {
  const type = issue.fields?.issuetype?.name?.toLowerCase();

  if (!type) {
    throw new Error("Issue type not found");
  }

  const mapping = config.problemTypeMapping;
  if (!mapping) {
    throw new Error(
      "problemTypeMapping is not defined in the task configuration."
    );
  }
  return mapping[type] || mapping.default || "task";
}
