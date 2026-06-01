export const getUserNotificationSettings = async (axios, identityServiceUrl, userId, microservicetalkingsecret, internalServiceSecret) => {
    const res = await axios.get(
        `${identityServiceUrl}/internal/user/${userId}/notification-settings`,
        {
            headers: {
                content: "application/json",
                'x-microservice-secret': microservicetalkingsecret,
                'x-internal-secret': internalServiceSecret,
            }
        }
    );
    return res.data;
}