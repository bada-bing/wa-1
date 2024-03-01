export function generateBranchName(issue) {
    const issuetype = createIssueType(issue);
    const key = issue.key;
    const summary = createSummary(issue);

    return `${issuetype}/${key}/${summary}`;
}

// title of logseq page (and potentially the linear issue and raindrop title)
export function generateTitle(issue) {
    const key = issue.key;
    const summary = createSummary(issue);

    return `${key}-${summary}`;
}


function createSummary(issue) {
    let summary = issue.fields.summary;
    summary = summary.toLowerCase();

    summary = summary.replace(/\s/g, '-');
    summary = summary.replace('shopping-cart', 'cart');
    summary = summary.replace(/-the-/g, '-');
    return summary;
}

// being more specific about the issue type would give better statistics
// I could analyse based on the number of branches what kind of tasks are most common
export function createIssueType(issue) {
    const issuetype = issue.fields.issuetype.name;

    switch (issuetype.toLowerCase()) {
        case 'task':
            return 'task';
        case 'bug':
            return 'bugfix'; // it could be 'task'
        case 'spike':
            return 'prototype';
        case 'improvement':
            return 'improvement'; // it could be 'task'
        case 'story':
            return 'feature';
        default:
            return 'feature';
    }
}

export function determineProject(issue) {
    const parent = issue.fields.parent.key;

    switch (parent) {
        case process.env.MAIN_PROJECT_JIRA_ISSUE:
            return process.env.MAIN_PROJECT;
        default:
            return process.env.MAIN_PROJECT;
    }
}

export function createLink(issueKey: string) {
    return `${process.env.JIRA_DOMAIN}/browse/${issueKey}`
}