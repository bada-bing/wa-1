import { LinearClient, User } from "@linear/sdk";
// https://developers.linear.app/docs/sdk/getting-started
import { AdaptedIssue } from "../integrations/jiraIssueAdapter";
import { env } from "./envConfig";
import { adaptIssueToLinear } from "../integrations/linearIssueAdapter";
const apiKey = env.get("LINEAR_API_KEY");

const linearClient = new LinearClient({ apiKey });

async function getCurrentUser(): Promise<User> {
  return linearClient.viewer;
}

export async function executeLinearProcedure(issue: AdaptedIssue) {
  // todo labels are missing
  // todo assignee is missing
  // todo priority is missing (should it be set to urgent?)
  // todo project is missing

  const input = await adaptIssueToLinear(issue);
  const res = linearClient.createIssue(input);

  console.log(
    `[linear] successfully created issue: ${(await (await res).issue)?.url}`
  );
}

export async function getMyTeams() {
  const I = await getCurrentUser();
  const myTeams = await I.teams();
  myTeams.nodes.forEach((team) => {
    console.log(`${team.name} [${team.id}]`);
  });
}

// get issue with the given id
export async function getIssue(issueId: string) {
  const issue = await linearClient.issue(issueId);
  return issue;
}

// Promise.resolve(getMyIssues()).then((data) => console.log(JSON.stringify(data)))
