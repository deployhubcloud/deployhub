export const getLatestBuildId = async (axios, projectId, buildServiceUrl, internalServiceSecret, microservicetalkingsecret) => {
    try {
        const response = await axios.get(`${buildServiceUrl}/for-other-service/build/latestBuildId/${projectId}`, {
            headers: {
                "Content-Type": "application/json",
                "x-internal-secret": internalServiceSecret,
                "x-microservice-secret": microservicetalkingsecret,
            },
            timeout: 10000
        })

        return response.data;
    } catch (error) {
        return null;
    }
}