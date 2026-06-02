export const getProjectDataById = async (axios, projectId, projectServiceUrl, internalServiceSecret, microservicetalkingsecret) => {
    try {
        const response = await axios.get(`${projectServiceUrl}//for-other-service/${projectId}`, {
            headers: {
                "Content-Type": "application/json",
                "x-internal-secret": internalServiceSecret,
                "x-microservice-secret": microservicetalkingsecret,
            }
        })

        return response.data;
    } catch (error) {
        return null;
    }
}