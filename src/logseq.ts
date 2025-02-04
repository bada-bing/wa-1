import nunjucks = require("nunjucks");
import fs = require("fs");
import os = require("os");
import { AdaptedIssue } from "./integrations/jiraIssueAdapter";
import { TaskConfig } from "./types/index";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);

/**
 * Create a new LogSeq page with the Jira issue details
 * @example pageName WPR-16569-incorporate-vue3-form-generator-in-side-panel-to-render-cart-item-forms
 */
export async function executeLogseqProcedure(
  issue: AdaptedIssue,
  config: TaskConfig
) {
  try {
    const logseqPages = config.logseq.pagesPath.replace(
      "${HOME}",
      os.homedir()
    );
    const pageFilename = `${logseqPages}/${issue.slug}.md`;

    const project = issue.project;

    const jira = {
      issue: issue.key,
      url: issue.jiraLink,
    };

    nunjucks.configure("src/templates", { autoescape: true });
    const pageContent = nunjucks.render("logseq.template.md", {
      jira,
      project,
      branch_name: issue.branchName,
      summary: issue.summary,
      slug: issue.slug,
      issue_type: issue.issueType,
    });

    await writeFileAsync(pageFilename, pageContent, "utf8");
    console.log("[logseq] Successfully created new page:", issue.slug);
  } catch (error) {
    console.log("[logseq] Error creating page:", error);
  }
}
