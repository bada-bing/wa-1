import { LinearClient, User } from "@linear/sdk";
// https://developers.linear.app/docs/sdk/getting-started
import { LinearIssueInput } from "../integrations/linearIssueAdapter";
import { env } from "./envConfig";
const apiKey = env.get("LINEAR_API_KEY");

const linearClient = new LinearClient({ apiKey });

async function getCurrentUser(): Promise<User> {
  return linearClient.viewer;
}

/*
  Execute Linear issue creation procedure.
  Accepts a standardized LinearIssueInput that can be produced by either work or study adapters.
*/
export async function executeLinearProcedure(
  input: LinearIssueInput
): Promise<void> {
  const res = linearClient.createIssue(input);
  const issue = (await (await res).issue)

  console.log(
    `[linear] successfully created issue ${issue?.id} in project ${issue?.project}: ${issue?.url}`
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
  const myTeams = (await I.teams());
  return myTeams.nodes
}

export async function getLinearTeam(options: { id?: string; key?: string }) {
  if (options.id) {
    // Fetch team directly by ID
    const team = await linearClient.team(options.id);
    return team;
  }
  
  if (options.key) {
    // Fetch all teams and find by key
    const teams = await getMyTeams();
    const theTeam = teams.find((t) => t.key === options.key);
    return theTeam;
  }
  
  throw new Error("Either id or key must be provided");
}

// get issue with the given id
export async function getIssue(issueId: string) {
  const issue = await linearClient.issue(issueId);
  return issue;
}

// get project by team and project name
export async function getLinearProject(
  teamConfig: { id?: string; key?: string },
  projectName: string
) {
  const team = await getLinearTeam(teamConfig);
  if (!team) {
    throw new Error(`Team not found for config: ${JSON.stringify(teamConfig)}`);
  }

  const projects = await team.projects()
  const project = projects.nodes.find((p) => p.name === projectName);
  
  return project;
}

// Promise.resolve(getMyIssues()).then((data) => console.log(JSON.stringify(data)))
