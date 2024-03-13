import { type Issue, fetchIssue } from './jira';
import { generateTitle, generateBranchName, determineProject, createIssueType } from './utils';
import { updateChangelog } from './updateChangelog';
import os = require('os');
import { exec } from 'child_process';
import { triggerLogSeqWorkflow } from './logseq';
import { triggerLinearWorkflow } from './linear';

const email = process.env.JIRA_USER;
const apiToken = process.env.JIRA_API_TOKEN;
const jiraDomain = process.env.JIRA_DOMAIN;

const ISSUE_KEY = process.argv[2];

fetchIssue(email, apiToken, jiraDomain, ISSUE_KEY)
    .then(processData)
    .catch(console.error);

function processData(issue: Issue) {
    // TODO commit the changelog changes
    triggerGitWorkflow(issue);
    triggerLogSeqWorkflow(issue);
    triggerLinearWorkflow(issue);

    // TODO instead of console.log make exec pbcopy
    // TODO generate title of the MR (same as the firt line of the changelog)
    console.log(generateTitle(issue));
}

// Debug the response in the Shell; Use it with the jq
function printOut(data: string) {
    console.log(JSON.stringify(data));
}


// todo extract to separate module
// Create new branch in git project and update changelog
async function triggerGitWorkflow(issue: Issue) {
    const home = os.homedir();
    const project = determineProject(issue);
    const projectDir = `${home}/src/${project}`;

    const branchName = generateBranchName(issue)
    const summary: string = issue.fields.summary; // raw summary without dashes
    const issueType = createIssueType(issue);

    // 1. checkout develop
    exec('git checkout develop', { cwd: projectDir }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        // 2. pull develop
        exec('git pull', { cwd: projectDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            // 3. create new branch
            exec(`git checkout -b ${branchName}`, { cwd: projectDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                // 4. update changelog
                const changelog = `${projectDir}/CHANGELOG.adoc`;
                updateChangelog(changelog, summary, issueType, ISSUE_KEY);
            });
        });
    });
}