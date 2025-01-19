import { Issue } from "./jira";

const apiToken = process.env.CLOCKIFY_API_KEY;
const workspaceId = process.env.CLOCKIFY_MAIN_WORKSPACE_ID;
const STORIES_ID = "63abf97bb3195930de04f412"


// TODO create new task in clockify
export function createClockifyTask(issueId: Issue["key"]) {
    const body = {
        "name": issueId,
        "status": "ACTIVE"
    }

    // make post request using fetch
    fetch(`https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects/${STORIES_ID}/tasks`, {
        method: 'POST', headers: {
            'X-Api-Key': apiToken,
            'Content-Type': 'application/json'
        }, body: JSON.stringify(body)
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log("Success: clockify task created");
        console.log(data);
    })
}