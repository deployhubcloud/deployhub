export const getUserNotificationSettings = async (axios, identityServiceUrl, userId, secret) => {
    const res = await axios.get(
        `${identityServiceUrl}/internal/user/${userId}/notification-settings`,
        {
            headers: { 'x-microservice-secret': secret }
        }
    );
    return res.data;
}