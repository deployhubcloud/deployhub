export const deleteDockerHubImage = async (imageName, dockerHubToken, dockerHubUsername, axios, docker) => {

    
    try {
        const image = docker.getImage(imageName);
        await image.inspect();
        await image.remove({ force: true });
    } catch (error) {
        if (error.statusCode !== 404) {
            console.error("Local image delete failed:", error.message);
        }
    }


    const [repoPath, tag = "latest"] = imageName.split(":");
    const firstSlash = repoPath.indexOf("/");

    if (firstSlash === -1) {
        throw new Error("Invalid image name format");
    }

    const username = repoPath.slice(0, firstSlash);
    const repository = repoPath.slice(firstSlash + 1);


    let jwt;
    try {
        const authRes = await axios.post(
            "https://hub.docker.com/v2/users/login/",
            {
                username: dockerHubUsername,
                password: dockerHubToken,
            },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        jwt = authRes.data.token;
    } catch (error) {
        console.error("Docker Hub auth failed:", error.response?.data || error.message);
        return { success: false, imageName, error: "auth_failed" };
    }


    try {
        await axios.delete(
            `https://hub.docker.com/v2/repositories/${username}/${repository}/tags/${tag}/`,
            {
                headers: {
                    Authorization: `JWT ${jwt}`,
                },
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            return {
                success: true, imageName, hub: "not_found"
            };
        }
        console.error("Hub image delete failed:", error.response?.data || error.message);
        return {
            success: false, imageName, error: "hub_delete_failed"
        };
    }

    return { success: true, imageName };
};