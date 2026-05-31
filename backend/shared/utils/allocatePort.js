export const allocatePort = async (redisclient, projectId) => {
    const port = await redisclient.incr('port:counter');

    if (port < 10000) {
        
        await redisclient.set('port:counter', 10000);
        await redisclient.set(`port:10000`, projectId.toString());
        return 10000;
    }

    if (port > 60000) {
        throw new Error("Port range exhausted");
    }

    await redisclient.set(`port:${port}`, projectId.toString());
    return port;
};