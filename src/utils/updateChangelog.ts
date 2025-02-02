import fs from "fs/promises";
import { createLink } from "../integrations/jiraIssueAdapter";

export async function updateChangelog(
  changelogPath: string,
  summary: string,
  issueType: string,
  issueKey: string
): Promise<void> {
  const content = `* ${createLink(issueKey)}[${issueKey}] ${summary}`;
  const defaultLineNumber = 10;

  let pattern: string;
  switch (issueType) {
    case "prototype":
      console.log("no changelog for prototype, i.e., spike");
      return;
    case "improvement":
    case "feature":
      pattern = "=== Added";
      break;
    case "task":
    case "bugfix":
      pattern = "=== Changed";
      break;
    default:
      pattern = "== UNRELEASED";
      break;
  }

  try {
    const data = await fs.readFile(changelogPath, "utf8");
    const lines = data.split("\n");

    let lineNumber = lines.findIndex((line) => line.includes(pattern));
    if (lineNumber === -1) {
      lineNumber = defaultLineNumber;
    }

    lines.splice(lineNumber + 1, 0, content);
    const updatedContent = lines.join("\n");

    await fs.writeFile(changelogPath, updatedContent, "utf8");
    console.log("[git] Successfully written to the CHANGELOG.");
  } catch (error) {
    throw new Error(
      `[git] Failed to update changelog: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
