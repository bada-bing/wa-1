import nunjucks = require("nunjucks");
import fs = require("fs");
import os = require("os");
import { BaseMetadata, StudyTaskMetadata, TaskConfig } from "./types/index";
import { promisify } from "util";
import { AdaptedIssue } from "./integrations/jiraIssueAdapter";

const writeFileAsync = promisify(fs.writeFile);

/**
 * Create a new LogSeq page with the issue details using a task-type-specific template
 * @example pageName WPR-16569-incorporate-vue3-form-generator-in-side-panel-to-render-cart-item-forms
 * @example template logseq.work-task.template.md or logseq.study-task.template.md
 */
export async function executeLogseqProcedure(
  issue: BaseMetadata,
  config: TaskConfig
) {
  try {
    const logseqPages = config.logseq.pagesPath.replace(
      "${HOME}",
      os.homedir()
    );
    const pageFilename = `${logseqPages}/${issue.slug}.md`;

    // Use task-type-specific template: logseq.<task-type>.template.md
    const templateName = `logseq.${config.type}.template.md`;

    // Prepare template data based on task type
    let templateData: Record<string, any>;

    switch (config.type) {
      case "work-task": {
        const workIssue = issue as AdaptedIssue;
        templateData = {
          jira: {
            issue: workIssue.key,
            url: workIssue.jiraLink,
          },
          project: workIssue.project,
          branch_name: workIssue.branchName,
          summary: workIssue.summary,
          slug: workIssue.slug,
          issue_type: workIssue.issueType,
        };
        break;
      }

      case "study-task": {
        const studyIssue = issue as StudyTaskMetadata;
        templateData = {
          key: studyIssue.key,
          summary: studyIssue.summary,
          slug: studyIssue.slug,
          source: studyIssue.source || "manual",
          initiative: studyIssue.initiative || "",
          objective: studyIssue.objective || "",
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${config.type}`);
    }

    nunjucks.configure("src/templates", { autoescape: true });
    const pageContent = nunjucks.render(templateName, templateData);

    await writeFileAsync(pageFilename, pageContent, "utf8");
    console.log(
      `[logseq] Successfully created new page using ${templateName}:`,
      issue.slug
    );
  } catch (error) {
    console.log("[logseq] Error creating page:", error);
  }
}
