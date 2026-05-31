export const fetchCommitSha = async (repoUrl, branch, githubAccessToken) => {
    try {
        const clean = repoUrl.endsWith('.git') ? repoUrl.slice(0, -4) : repoUrl;
        const parts = clean.split('/');
        const owner = parts[3];
        const repo = parts[4];

        const headers = { "Accept": "application/vnd.github.v3+json" };
        if (githubAccessToken) headers.Authorization = `token ${githubAccessToken}`;

        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
            { headers }
        );
        const data = await res.json();
        return data?.object?.sha || null;
    } catch {
        return null;
    }
};