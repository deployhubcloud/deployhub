export const allocatePort = async (redisclient, projectId, portModel) => {
    const port = await redisclient.incr('deployhub:port:counter');

    if (port < 10000) {

        await redisclient.set('deployhub:port:counter', 10000);
        await redisclient.set(`deployhub:port:10000`, projectId.toString());
        return 10000;
    }


    if (port > 60000) {
        throw new Error("Port range exhausted");
    }

    const dbPort = await portModel.findOne({ port });
    if (dbPort) {
        continue;
    }

    await redisclient.set(`deployhub:port:${port}`, projectId.toString());

    await portModel.create({
        port,
        projectId
    });

    return port;
};