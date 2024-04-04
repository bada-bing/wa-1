import { type Issue, fetchIssue } from './jira';
import { generateBranchName, determineProject, createIssueType } from './utils';
import { updateChangelog } from './updateChangelog';
import os = require('os');
import { exec } from 'child_process';
import { executeLogseqProcedure, createTitle } from './logseq';
import { executeLinearProcedure } from './linear';

const email = process.env.JIRA_USER;
const apiToken = process.env.JIRA_API_TOKEN;
const jiraDomain = process.env.JIRA_DOMAIN;

const ISSUE_KEY = process.argv[2]

fetchIssue(email, apiToken, jiraDomain, ISSUE_KEY)
    .then(launchBootstrapProtocol)
    .catch(console.error);

function launchBootstrapProtocol(issue: Issue) {
    executeGitProcedure(issue);
    // TODO call LogSeq API to open the newly created page
    executeLogseqProcedure(issue);
    executeLinearProcedure(issue);
    // TODO add the raindrop procedure, i.e., workflow

    // TODO generate title of the MR (same as the firt line of the changelog)
    // TODO instead of console.log make exec pbcopy
    console.log(createTitle(issue));
}

// Debug the response in the Shell; Use it with the jq
function printOut(data: string) {
    console.log(JSON.stringify(data));
}


// todo extract to separate module
// Create new branch in git project and update changelog
async function executeGitProcedure(issue: Issue) {
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
                // TODO 5. commit the changelog changes

            });
        });
    });
}