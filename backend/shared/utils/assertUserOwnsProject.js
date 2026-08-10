import { AppError } from '../errors/AppError.js';


export async function assertUserOwnsProject({
    projectServiceUrl,
    internalSecret,
    talkingSecret,
    projectId,
    userId,
    axiosInstance
}) {
    if (!projectId || !userId) {
        throw new AppError('Project not found', 404);
    }

    try {
        const { data } = await axiosInstance.get(
            `${projectServiceUrl}/for-other-service/${projectId}`,
            {
                headers: {
                    'x-internal-secret': internalSecret,
                    'x-microservice-secret': talkingSecret,
                },
                timeout: 10000,
            }
        );

        if (!data || String(data.userId) !== String(userId)) {
            throw new AppError('Project not found', 404);
        }

        if (data.status === 'deleted') {
            throw new AppError('Project not found', 404);
        }

        return data;
    } catch (error) {
        if (error instanceof AppError) throw error;
        if (error.response?.status === 404) {
            throw new AppError('Project not found', 404);
        }
        throw new AppError('Failed to verify project ownership', 502);
    }
}
