import { env } from "../utils/envConfig";

// TODO this type is somewhat domain specific, should be read from the JSON config
export type RawJiraIssue = {
  key: string;
  fields: {
    summary: string;
    issuetype: {
      name: string;
    };
    parent: {
      key: string;
    };
    customfield_10008: number | null; // Story Points
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

  const config = {
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
