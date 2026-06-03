export const getUserNotificationSettings = async (axios, projectServiceUrl, projectId, microservicetalkingsecret, internalServiceSecret) => {
    const res = await axios.get(
        `${projectServiceUrl}/for-other-service/${projectId}/notification-settings`,
        {
            headers: {
                "Content-Type": "application/json",
                'x-microservice-secret': microservicetalkingsecret,
                'x-internal-secret': internalServiceSecret,
            }
        }
    );
    return res.data?.notifications || {};
}
