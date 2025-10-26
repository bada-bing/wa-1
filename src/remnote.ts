/**
 * RemNote Integration
 * 
 * NOTE: RemNote currently does not have a public REST API for external integrations.
 * The RemNote Plugin API is designed for plugins that run inside the RemNote application,
 * not for external programmatic access.
 * 
 * Possible approaches to integrate with RemNote:
 * 
 * 1. **RemNote Plugin (Recommended)**: Create a RemNote plugin that listens for external
 *    events (e.g., via webhook or polling a local file) and creates pages accordingly.
 *    See: https://plugins.remnote.com/getting-started/overview
 * 
 * 2. **Manual Markdown Import**: Export the task details as a markdown file to a watched
 *    folder, then manually import it into RemNote.
 * 
 * 3. **Browser Automation**: Use tools like Playwright or Puppeteer to automate the
 *    RemNote web interface (fragile and not recommended).
 * 
 * 4. **Contact RemNote**: Request API access from the RemNote team for external integrations.
 *    Discord community: https://discord.com/channels/689979930804617224
 * 
 * For now, this implementation creates a markdown file that can be manually imported
 * into RemNote or used by a custom RemNote plugin.
 */

import { AdaptedIssue } from "./integrations/jiraIssueAdapter";
import { TaskConfig } from "./types";
import fs = require("fs");
import os = require("os");
import path = require("path");
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

interface RemNoteConfig {
  exportPath: string; // Path where markdown files will be exported for manual import
}

/**
 * Creates a markdown file for RemNote import
 */
export async function executeRemNoteProcedure(
  issue: AdaptedIssue,
  config: TaskConfig
) {
  try {
    // Check if RemNote config exists
    if (!config.remnote) {
      console.log(
        "[remnote] RemNote configuration not found, skipping RemNote integration"
      );
      return;
    }

    const exportPath = config.remnote.exportPath.replace(
      "${HOME}",
      os.homedir()
    );

    // Ensure export directory exists
    await mkdirAsync(exportPath, { recursive: true });

    const filename = path.join(exportPath, `${issue.slug}.md`);

    // Create markdown content suitable for RemNote
    const content = generateRemNoteMarkdown(issue);

    await writeFileAsync(filename, content, "utf8");

    console.log(
      `[remnote] Successfully created RemNote markdown file: ${filename}`
    );
    console.log(
      `[remnote] Please manually import this file into RemNote or use a custom RemNote plugin to auto-import.`
    );
  } catch (error) {
    console.error("[remnote] Error creating RemNote export:", error);
    // Don't throw - this is optional functionality
  }
}

function generateRemNoteMarkdown(issue: AdaptedIssue): string {
  // RemNote uses standard markdown with some extensions
  return `# ${issue.key} - ${issue.summary}

## Details
- **Issue Key**: ${issue.key}
- **Issue Type**: ${issue.issueType}
- **Story Points**: ${issue.storyPoints || "N/A"}
- **Branch**: \`${issue.branchName}\`

## Links
- [Jira](${issue.jiraLink})
- [LogSeq](logseq://graph/kb_logseq?page=${issue.slug})

## Notes
<!-- Add your study notes here -->

## References
<!-- Add references and resources here -->

## Questions
<!-- Add questions you want to answer -->
`;
}
