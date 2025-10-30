import { LinearClient, User } from "@linear/sdk";
// https://developers.linear.app/docs/sdk/getting-started
import { env } from "../../utils/envConfig";
import { CreateLinearIssueInput } from "../../types/linear";

const apiKey = env.get("LINEAR_API_KEY");

const linearClient = new LinearClient({ apiKey });
async function getCurrentUser(): Promise<User> {
  return linearClient.viewer;
}

/*
  Execute Linear issue creation procedure.
  Accepts a standardized LinearIssueInput that can be produced by either work or study adapters.
*/
export async function createLinearIssue(
  input: CreateLinearIssueInput
): Promise<void> {
  const res = linearClient.createIssue(input);
  const issue = (await (await res).issue)

  console.log(
    `[linear] successfully created issue ${issue?.id} in project ${(await issue?.project)?.name}: ${issue?.url}`
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

export async function getLinearTeam(options: { id?: string; key?: string }): Promise<string> {
  if (options.id) {
    // Fetch team directly by ID
    const team = await linearClient.team(options.id);
    if (!team) {
      throw new Error(`Team not found with id: ${options.id}`);
    }
    return team.id;
  }

  if (options.key) {
    // Fetch all teams and find by key
    const teams = await getMyTeams();
    const theTeam = teams.find((t) => t.key === options.key);
    if (!theTeam) {
      throw new Error(`Team not found with key: ${options.key}`);
    }
    return theTeam.id;
  }

  throw new Error("[Linear] Either id or key must be provided");
}

export async function getIssue(issueId: string) {
  const issue = await linearClient.issue(issueId);
  return issue;
}

// get project by team and project name
export async function getLinearProject(
  teamConfig: { id?: string; key?: string },
  projectName: string
) {
  const teamId = await getLinearTeam(teamConfig);
  const team = await linearClient.team(teamId);

  const projects = await team.projects()
  const project = projects.nodes.find((p) => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found in team ${teamId}`);
  }

  return project;
}

// Promise.resolve(getMyIssues()).then((data) => console.log(JSON.stringify(data)))

/*
  Helper to get current user and TODO state
*/
export async function getDefaultAssigneeAndState(teamId: string) {
  const currentUser = await linearClient.viewer;

  // Get the TODO workflow state for the team
  const states = await linearClient.workflowStates({
    filter: { team: { id: { eq: teamId } } }
  });
  const todoState = states.nodes.find(state =>
    state.name.toLowerCase() === 'todo' || state.type === 'backlog'
  );

  return {
    assigneeId: currentUser.id,
    stateId: todoState?.id
  };
}
