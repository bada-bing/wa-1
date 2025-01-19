import { LinearClient, User } from "@linear/sdk";
// https://developers.linear.app/docs/sdk/getting-started
import { createLink } from "../utils";
import nunjucks = require("nunjucks");
import type { Issue } from "../jira";

const apiKey = process.env.LINEAR_API_KEY;

const linearClient = new LinearClient({ apiKey });

async function getCurrentUser(): Promise<User> {
  return linearClient.viewer;
}

function setEstimate(storyPoints: number): number {
  // estimate; 1 - xs, 2 -s, 3 - m, 5 - l , 8 - xl
  // no value is set for the "no estimate"
  if (storyPoints <= 2) {
    return 1;
  } else if (storyPoints <= 5) {
    return 2;
  } else if (storyPoints <= 8) {
    return 3;
  } else if (storyPoints <= 13) {
    return 5;
  } else {
    return 8;
  }
}

export async function executeLinearProcedure(jiraIssue: Issue) {
  const team = await linearClient.team("ba915a95-a2cb-4bc7-ab0c-bf193889bd11");

  const title = `${jiraIssue.key} ✨ ${jiraIssue.fields.summary}`;
  const url = createLink(jiraIssue.key);

  const jira = {
    url,
  };

  const storyPoints = jiraIssue.fields.customfield_10008;

  // todo the priority is missing
  const priority = 0;
  // todo labels are missing

  nunjucks.configure("templates", { autoescape: true });
  const description = nunjucks.render("linear.template.md", { jira });

  const input: Parameters<typeof linearClient.createIssue>[0] = {
    title,
    description,
    teamId: team.id,
    priority,
  };

  if (storyPoints) {
    input.estimate = setEstimate(storyPoints);
  }

  const res = linearClient.createIssue(input);

  console.log("New Linear issue: ", (await (await res).issue).url);
}

async function getMyIssues() {
  const I = await getCurrentUser();
  // const myIssues = await I.assignedIssues();
  const myIssues = await I.createdIssues();
  const myTeams = await I.teams();
  myTeams.nodes.forEach((team) => {
    console.log(`${team.name} [${team.id}]`);
  });

  if (myIssues.nodes.length) {
    myIssues.nodes.forEach(async (issue) => {
      const team = (await issue.team)?.name || "No team";
      console.log(`${I.displayName} has issue: ${issue.title} [${team}]`);
    });
  } else {
    console.log(`${I.displayName} has no issues`);
  }
}

// Promise.resolve(getMyIssues()).then((data) => console.log(JSON.stringify(data)))
