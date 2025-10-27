import nunjucks = require("nunjucks");
import { LinearClient } from "@linear/sdk";
import { env } from "../utils/envConfig";
import { AdaptedIssue } from "./jiraIssueAdapter";
import { StudyTaskMetadata } from "../types";
import { getLinearTeam } from "../utils/linear";
const apiKey = env.get("LINEAR_API_KEY");

const linearClient = new LinearClient({ apiKey });
export type LinearIssueInput = Parameters<typeof linearClient.createIssue>[0];

/*
  Work-specific adapter: converts AdaptedIssue (from Jira) to LinearIssueInput
*/
export async function adaptWorkIssueToLinear(
  issue: AdaptedIssue,
  teamConfig: { id?: string; key?: string }
): Promise<LinearIssueInput> {
  const title = `${issue.key} ✨ ${issue.summary}`;
  
  // Resolve team ID from config
  const team = await getLinearTeam(teamConfig);
  if (!team) {
    throw new Error(`Team not found for config: ${JSON.stringify(teamConfig)}`);
  }

  const links = {
    jira: issue.jiraLink,
    gitlab: "#", // TODO: issue.gitlabLink,
    logseq: `logseq://graph/kb_logseq?page=${issue.slug}`,
    clockify: "#", // TODO: issue.clockifyLink,
  };

  nunjucks.configure("src/templates", { autoescape: true });
  const description = nunjucks.render("linear.template.md", { links });

  const linearIssue: LinearIssueInput = {
    title,
    description,
    teamId: team.id,
  };

  if (issue.storyPoints) {
    linearIssue.estimate = setEstimate(issue.storyPoints);
  }

  return linearIssue;
}

/*
  Study-specific adapter: converts StudyTaskMetadata to LinearIssueInput
*/
export async function adaptStudyIssueToLinear(
  studyTask: StudyTaskMetadata,
  teamConfig: { id?: string; key?: string }
): Promise<LinearIssueInput> {
  const title = `${studyTask.key} 📚 ${studyTask.summary}`;
  
  // Resolve team ID from config
  const team = await getLinearTeam(teamConfig);
  if (!team) {
    throw new Error(`Team not found for config: ${JSON.stringify(teamConfig)}`);
  }

  const links = {
    logseq: `logseq://graph/kb_logseq?page=${studyTask.slug}`,
    source: studyTask.source || "manual",
    initiative: studyTask.initiative || "N/A",
    objective: studyTask.objective || "N/A",
  };

  nunjucks.configure("src/templates", { autoescape: true });
  const description = nunjucks.render("linear.template.md", { links });

  const linearIssue: LinearIssueInput = {
    title,
    description,
    teamId: team.id,
    // Study tasks typically don't have estimates initially
  };

  return linearIssue;
}

/*
  Legacy adapter for backward compatibility
  @deprecated Use adaptWorkIssueToLinear or adaptStudyIssueToLinear instead
*/
export async function adaptIssueToLinear(
  issue: AdaptedIssue,
  teamConfig?: { id?: string; key?: string }
) {
  if (!teamConfig) {
    throw new Error("Team configuration is required (provide id or key)");
  }
  return adaptWorkIssueToLinear(issue, teamConfig);
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

