import { AdaptedIssue } from "./integrations/jiraIssueAdapter";
import { env } from "./utils/envConfig";

const apiToken = env.get("CLOCKIFY_API_KEY");
const workspaceId = env.get("CLOCKIFY_MAIN_WORKSPACE_ID");
const STORIES_ID = env.get("CLOCKIFY_PROJECT_STORIES_ID");

export async function createClockifyTask({ key }: { key: string }) {
  if (!apiToken || !workspaceId) {
    throw new Error(
      "Missing required environment variables: CLOCKIFY_API_KEY or CLOCKIFY_MAIN_WORKSPACE_ID"
    );
  }

  const body = {
    name: key,
    status: "ACTIVE",
  };

  try {
    const response = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${STORIES_ID}/tasks`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Clockify API error: ${response.statusText}. Details: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("[clockify] Successfully created task:", key);
    return data;
  } catch (error) {
    console.error("[clockify] Failed to create task:", error);
    // Log the request body for debugging
    console.error("[clockify] Request body:", body);
    throw error;
  }
}
