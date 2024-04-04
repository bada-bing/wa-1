import { createDashedSummary } from "./utils";

import nunjucks = require("nunjucks");
import fs = require('fs');
import os = require('os');
import { createLink, determineProject } from './utils';
import type { Issue } from "./jira";

// title of logseq page (and potentially the linear issue and raindrop title)
export function createTitle(issue) {
    const key = issue.key;
    const summary = createDashedSummary(issue);

    return `${key}-${summary}`;
}

/**
 * Create a new LogSeq page with the Jira issue details
 * @example pageName WPR-16569-incorporate-vue3-form-generator-in-side-panel-to-render-cart-item-forms
 */
export async function executeLogseqProcedure(issue: Issue) {

    const pageName = createTitle(issue);
    const jiraIssue = issue.key;

    try {
        await createLogseqPage(pageName, jiraIssue, issue);
        //   TODO Open the page in the LogSeq app; update jdoc
        //   - check logseq-active-task.ts for how to open a page in LogSeq

    } catch (error) {
        console.log('Error creating LogSeq page:', error);
    }
}

async function createLogseqPage(pageName: string, jiraIssue: string, issue: Issue) {
    // todo save the folder location in the config
    const home = os.homedir();
    const dropbox = `${home}/Library/CloudStorage/Dropbox`;
    const logseqPages = `${dropbox}/obsidian_vaults/kb_logseq/pages`;

    const pageFilename = `${logseqPages}/${pageName}.md`;

    const project = determineProject(issue);

    const jira = {
        issue: jiraIssue,
        url: createLink(jiraIssue),
        summary: issue.fields.summary // todo check how to 'remove noise' in createDashedSummary, and do same here
    };

    nunjucks.configure('templates', { autoescape: true });
    const pageContent = nunjucks.render('logseq.template.md', { jira, project });

    fs.writeFile(pageFilename, pageContent, 'utf8', (writeError) => {
        if (writeError) {
            console.error('Error writing to the LogSeq:', writeError);
        } else {
            console.log('Successfully created new LogSeq page:', pageFilename);
        }
    });
}