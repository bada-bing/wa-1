const fs = require('fs');

import { createLink } from './utils';


export function updateChangelog(changelogPath, summary, issueType, issueKey) {
    const content = `* ${createLink(issueKey)}[${issueKey}] ${summary}`;

    const defaultLineNumber = 10;

    let pattern;

    switch (issueType) {
        case 'prototype':
            console.log('no changelog for prototype, i.e., spike');
            return;
        case 'improvement':
        case 'feature':
            pattern = '=== Added';
            break;
        case 'task':
        case 'bugfix':
            pattern = '=== Changed';
            break;
        default:
            pattern = '== UNRELEASED';
            break;
    }

    fs.readFile(changelogPath, 'utf8', (readError, data) => {
        if (readError) {
            console.error('Error reading the CHANGELOG:', readError);
            return;
        }

        const lines = data.split('\n');

        let lineNumber = lines.findIndex(line => line.includes(pattern));

        if (lineNumber === -1) {
            lineNumber = defaultLineNumber;
        }

        lines.splice(lineNumber + 1, 0, content);
        const updatedContent = lines.join('\n');

        fs.writeFile(changelogPath, updatedContent, 'utf8', (writeError) => {
            if (writeError) {
                console.error('Error writing to the CHANGELOG:', writeError);
            } else {
                console.log('Successfully written to the CHANGELOG.');
            }
        });
    });
}