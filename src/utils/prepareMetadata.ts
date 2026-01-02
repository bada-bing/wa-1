import { env } from "./envConfig";

/**
 * Sanitize a summary string to be used in slugs, branch names, or file names
 * Converts to lowercase, replaces non-alphanumeric with dashes, spaces with underscores
 */
export function sanitizeSummary(summary: string): string {
  let sanitized = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s:]+/g, "-") // replace non-alphanumeric characters with dashes (except : and spaces)
    .replace(/:/g, "_") // replace colons with underscores
    .replace(/\s/g, "_") // replace spaces with underscores
    .replace(/_+/g, "_") // collapse multiple underscores into one
    .replace(/^[-_]+|[-_]+$/g, ""); // trim leading/trailing dashes and underscores

  // TODO: reducing of words should be specified in the config
  // TODO: considering that the summary is sanitized before removing the words, 
  // should remove the noise before (because sanitization changes the words)
  // remove the noise, i.e., reduce the number of words
  sanitized = sanitized.replace(/shopping_cart/g, "cart");
  sanitized = sanitized.replace(/_the_/g, "-");

  return sanitized;
}

/**
 * Generate a slug from a key and summary
 * Used as the title of logseq page (and potentially the linear issue and raindrop title)
 */
export function generateSlug(taskId: string, summary: string): string {
  const sanitized = sanitizeSummary(summary);
  return `${taskId}-${sanitized}`;
}

export function generateJiraLink(issueKey: string) {
  return `${env.get("JIRA_DOMAIN")}/browse/${issueKey}`;
}
