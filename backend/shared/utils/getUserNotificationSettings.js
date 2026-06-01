export const getUserNotificationSettings = async (axios, projectServiceUrl, userId, microservicetalkingsecret, internalServiceSecret) => {
    const res = await axios.get(
        `${projectServiceUrl}/internal/user/${userId}/notification-settings`,
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