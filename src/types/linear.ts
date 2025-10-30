/**
 * Manual type definition for Linear issue creation input
 * Based on the fields we actually use from Linear's CreateIssueInput
 */
export interface CreateLinearIssueInput {
  title: string;
  description?: string;
  teamId: string;
  assigneeId: string;
  stateId?: string;
  priority?: number;
  estimate?: number;
  projectId?: string;
  labelIds?: string[];
}
