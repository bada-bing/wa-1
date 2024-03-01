export function fetchIssue(email, apiToken, jiraDomain, issueKey) {
    // Encode credentials for Basic Auth - base64EncodedCredentials
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    // Construct the request options
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
        }
    };

    const url = `${jiraDomain}/rest/api/3/issue/${issueKey}`;

    return fetch(url, options)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log(response);
                throw new Error('Error fetching issue: ' + response.status);
            }
        })
}