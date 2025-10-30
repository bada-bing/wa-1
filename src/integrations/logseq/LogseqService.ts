import nunjucks = require("nunjucks");
import fs = require("fs");
import os = require("os");
import { TaskConfig } from "../../types";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);

/**
 * Create a new LogSeq page with the issue details using a task-type-specific template
 * This is a domain-agnostic integration service - the caller is responsible for
 * preparing the template data according to their needs.
 *
 * @param slug - The page slug (filename without extension)
 * @param templateName - Template filename (e.g., "logseq.work-task.template.md")
 * @param templateData - Data to render in the template
 * @param config - Task configuration
 *
 * @example pageName WPR-16569-incorporate-vue3-form-generator-in-side-panel-to-render-cart-item-forms
 * @example template logseq.work-task.template.md or logseq.study-task.template.md
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
    const pageFilename = `${logseqPages}/${slug}.md`;

    nunjucks.configure("src/templates", { autoescape: true });
    const pageContent = nunjucks.render(templateName, templateData);

    await writeFileAsync(pageFilename, pageContent, "utf8");
    console.log(
      `[logseq] Successfully created new page using ${templateName}:`,
      slug
    );
  } catch (error) {
    console.log("[logseq] Error creating page:", error);
  }
}
