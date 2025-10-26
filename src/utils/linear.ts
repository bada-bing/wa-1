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

export async function executeLinearProcedure(
  issue: AdaptedIssue,
  teamId?: string
) {
  // todo labels are missing
  // todo assignee is missing
  // todo priority is missing (should it be set to urgent?)
  // todo project is missing

  const input = await adaptIssueToLinear(issue, teamId);
  const res = linearClient.createIssue(input);

  console.log(
    `[linear] successfully created issue: ${(await (await res).issue)?.url}`
  );
}

// you need to know for which team to create a task (team is on the level of a client, which is based on the type of the task)
// Team should be responsible for types of tasks (e.g., one team for work and one for study)
// Projects (associated to teams) should be related to initiatives (e.g., 10x)
//TODO this is the method to get the list of teams
// - afterwards you will have to find the team which has the key same as the initiative
// 
export async function getMyTeams() {
  const I = await getCurrentUser();
  const myTeams = await I.teams();
  myTeams.nodes.forEach((team) => {
    console.log(`${team.name} [${team.id}]`);
  });
  console.dir(myTeams.nodes.at(0))
}

// get issue with the given id
export async function getIssue(issueId: string) {
  const issue = await linearClient.issue(issueId);
  return issue;
}

// Promise.resolve(getMyIssues()).then((data) => console.log(JSON.stringify(data)))
