import nunjucks = require("nunjucks");
import fs from "fs/promises";
import os = require("os");
import path from "path"; // Import path module
import { TaskConfig } from "../../types";

/**
 * Create a new LogSeq page if a page for that task id doesn't already exist.
 * This function is idempotent. It checks if any file in the target directory
 * contains the task id (e.g., 'WORK-10') in its name before creating a new one.
 * It will not overwrite any existing files.
 * If an existing file is found with the issue key but a non-standard name, a warning is logged.
 *
 * @param slug The page slug for the new file (e.g., 'wfc-1055-do-a-thing')
 * @param templateName The template file to use.
 * @param templateData Data for the template. Must contain `jira.issue` for the check.
 * @param config The task configuration.
 */
export async function executeLogseqProcedure(
  slug: string,
  templateName: string,
  templateData: Record<string, any>,
  config: TaskConfig
) {
  try {
    const logseqPages = config.logseq.pagesPath.replace(
      "${HOME}",
      os.homedir()
    );

    // 1. Check if a file containing the issue key already exists.
    const issueKey = templateData.jira?.issue;
    if (!issueKey) {
      throw new Error(
        "[logseq] `jira.issue` not found in templateData. Cannot check for existing files."
      );
    }

    const files = await fs.readdir(logseqPages);
    const existingFile = files.find((file) => file.includes(issueKey));

    if (existingFile) {
      const expectedFilenameBase = `${slug}.md`;
      const existingFilenameBase = path.basename(existingFile);

      if (existingFilenameBase !== expectedFilenameBase) {
        console.warn(
          `[logseq] Warning: Found existing file '${existingFile}' containing issue key '${issueKey}'. Expected filename for this issue is '${expectedFilenameBase}'.`
        );
      }

      console.log(
        `[logseq] A file for issue key '${issueKey}' already exists: '${existingFile}'. Skipping creation.`
      );
      return;
    }

    // 2. If no file exists, generate content and create the new page.
    const pageFilename = path.join(logseqPages, `${slug}.md`); // Use path.join for robustness
    nunjucks.configure("src/templates", { autoescape: true });
    const pageContent = nunjucks.render(templateName, templateData);

    await fs.writeFile(pageFilename, pageContent, "utf8");
    console.log(
      `[logseq] Successfully created new page using ${templateName}:`,
      slug
    );
  } catch (error) {
    console.log("[logseq] Error creating page:", error);
  }
}
