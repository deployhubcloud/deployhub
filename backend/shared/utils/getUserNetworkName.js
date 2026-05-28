import { AppError } from "../errors/AppError.js";



export const getUserNetworkName = async (axios, identityServiceUrl, userId, internalServiceSecret) => {

    const indentityServiceUrl = identityServiceUrl;

    if (!indentityServiceUrl) {
        throw new AppError("Identity service URL is not defined in environment variables", 500);
    }

    const response = await axios.get(`${indentityServiceUrl}/users/${userId}/network-name`, {
        headers: {
            "Content-Type": "application/json",
            "x-microservice-secret": internalServiceSecret
        }
    });
    if (response.status !== 200) {
        throw new AppError("Failed to fetch user network name from identity service", response.status);
    }

    return response.data.networkName;
}