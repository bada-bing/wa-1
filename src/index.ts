import { type Issue, fetchIssue } from "./jira";
import { generateBranchName, determineProject, createIssueType } from "./utils";
import { updateChangelog } from "./updateChangelog";
import os = require("os");
import { exec } from "child_process";
import { executeLogseqProcedure } from "./logseq";
import { executeLinearProcedure } from "./linear";

const email = process.env.JIRA_USER;
const apiToken = process.env.JIRA_API_TOKEN;
const jiraDomain = process.env.JIRA_DOMAIN;

const ISSUE_KEY = process.argv[2];

// TODO sanitizing
// if issue summary has "." in the name it will create a hierarchy of pages in logseq
// for some reason logseq used dots for page hierarchy
// e.g., WPR-17984-dependency-update-of-wescale-ui-to-wui_wescale-ui@0_5_0-in-cart-ui-next was created as WPR-17984-dependency-update-of-wescale-ui-to-wui_wescale-ui@0/ -> 5/ -> ... before sanitizing

// TODO Create application customizable - Read important parameters from JSON configuration
// 1. save the list of projects in the config (what you currently read from ENV variables as first and side project should be a list of projects in the json)
// 2. important locations (e.g., location of logseq knowledge base)
// 3. important IDs (e.g., linear team)

// TODO Add ACCs to the implementation section of the logseq page

// TODO call LogSeq API to open the newly created page
// maybe you don't even need to do that, and it is enough to start work session

fetchIssue(email, apiToken, jiraDomain, ISSUE_KEY)
  .then(launchBootstrapProtocol)
  .catch(console.error);

function launchBootstrapProtocol(issue: Issue) {
  executeGitProcedure(issue);

  executeLogseqProcedure(issue);
  executeLinearProcedure(issue);
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

  const branchName = generateBranchName(issue);
  const summary: string = issue.fields.summary; // raw summary without dashes
  const issueType = createIssueType(issue);

  // 1. checkout develop
  exec("git checkout develop", { cwd: projectDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    // 2. pull develop
    exec("git pull", { cwd: projectDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      // 3. create new branch
      exec(
        `git checkout -b ${branchName}`,
        { cwd: projectDir },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          // 4. update changelog
          const changelog = `${projectDir}/CHANGELOG.adoc`;
          updateChangelog(changelog, summary, issueType, ISSUE_KEY);
          // TODO consider if you want to commit the changelog changes
        }
      );
    });
  });
}
