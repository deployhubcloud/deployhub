export const getUserGithubAccessToken = async (axios, identityServiceUrl, userId, internalServiceTalkingSecret) => {
    try {

        const response = await axios.get(`${identityServiceUrl}/users/${userId}/github-access-token`, {
            headers: {
                "Content-Type": "application/json",
                "x-microservice-secret": internalServiceTalkingSecret
            }
        });

        return response.data.githubAccessToken;

    } catch (error) {
        console.error("Error fetching GitHub access token:", error);
        return null;
    }
}