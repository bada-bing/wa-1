import { generateTitle } from "./utils";

import nunjucks = require("nunjucks");
import fs = require('fs');
import os = require('os');
import { createLink, determineProject } from './utils';

// create new page in logseq
export function triggerLogSeqWorkflow(issue) {

    const home = os.homedir();
    const dropbox = `${home}/Library/CloudStorage/Dropbox`;
    const logseqPages = `${dropbox}/obsidian_vaults/kb_logseq/pages`;

    const pageName = generateTitle(issue);

    const jiraIssue = issue.key;
    const jira = {
        issue: jiraIssue,
        url: createLink(jiraIssue),
        summary: issue.fields.summary
    };

    const project = determineProject(issue);

    const pageFilename = `${logseqPages}/${pageName}.md`;
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