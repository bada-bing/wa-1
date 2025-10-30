import nunjucks = require("nunjucks");
import { CreateLinearIssueInput } from "../../types/linear";
import { getLinearTeam, getDefaultAssigneeAndState, getLinearProject } from "../../integrations/linear/LinearClient";

/**
 * Generic adapter: converts task metadata to LinearIssueInput
 * This is the base adapter used by both WorkTask and StudyTask adapters
 */
export async function adaptTaskToLinear(
  key: string,
  summary: string,
  slug: string,
  titlePrefix: string,
  links: Record<string, string>,
  teamConfig: { id?: string; key?: string },
  projectName: string,
  additionalFields?: Partial<CreateLinearIssueInput>
): Promise<CreateLinearIssueInput> {
  const title = `${key} ${titlePrefix} ${summary}`;

  // Resolve team ID from config (throws if not found)
  const teamId = await getLinearTeam(teamConfig);

  nunjucks.configure("src/templates", { autoescape: true });
  const description = nunjucks.render("linear.template.md", { links });

  // Get current user and TODO state
  const { assigneeId, stateId } = await getDefaultAssigneeAndState(teamId);

  const projectId = (await getLinearProject(teamConfig, projectName)).id || "";

  // TODO you need to set priority (e.g., to 1)
  // TODO you need to set labels

  const linearIssue: CreateLinearIssueInput = {
    title,
    description,
    teamId,
    assigneeId,
    stateId,
    projectId,
    ...additionalFields,
  };

  return linearIssue;
}
