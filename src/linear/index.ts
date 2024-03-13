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

export async function triggerLinearWorkflow(jiraIssue: Issue) {
    const team = await linearClient.team("ba915a95-a2cb-4bc7-ab0c-bf193889bd11");

    const title = `${jiraIssue.key} ✨ ${jiraIssue.fields.summary}`
    const url = createLink(jiraIssue.key);

    const jira = {
        url,
    }

    // todo the priority is missing
    const priority = 0;
    // todo the estimate is missing
    // todo labels are missing


    nunjucks.configure('templates', { autoescape: true });
    const description = nunjucks.render('linear.template.md', { jira });

    const res = linearClient.createIssue({
        title,
        description,
        teamId: team.id,
        priority
    });

    console.log("New Linear issue: ", (await (await res).issue).url);
}