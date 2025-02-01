import nunjucks = require("nunjucks");
import { LinearClient } from "@linear/sdk";
import { env } from "../utils/envConfig";
import { AdaptedIssue } from "./jiraIssueAdapter";
import { getMyTeams } from "../utils/linear";
const apiKey = env.get("LINEAR_API_KEY");

/*
  This adapter is used to adapt the issue to the Linear format.
  It is used to create a new issue in Linear.
import { IssueCreateInput } from "@linear/sdk/dist/_generated_documents";
*/

export async function adaptIssueToLinear(issue: AdaptedIssue) {
  const linearClient = new LinearClient({ apiKey });

  const title = `${issue.key} ✨ ${issue.summary}`;
  // TODO do I need the instance of the team? I just pass the id

  const linearIssue: Parameters<typeof linearClient.createIssue>[0] = {
    title,
    description: setDescription(issue),
    estimate: setEstimate(issue.storyPoints),
    teamId: env.get("LINEAR_TEAM_ID"),
  };

  if (issue.storyPoints) {
    linearIssue.estimate = setEstimate(issue.storyPoints);
  }

  return linearIssue;
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

function setDescription(issue: AdaptedIssue) {
  const links = {
    jira: issue.jiraLink,
    gitlab: "#", // TODOissue.gitlabLink,
    logseq: `logseq://graph/kb_logseq?page=${issue.slug}`,
    clockify: "#", // TODO issue.clockifyLink,
  };

  nunjucks.configure("src/templates", { autoescape: true });
  const description = nunjucks.render("linear.template.md", { links });

  return description;
}
