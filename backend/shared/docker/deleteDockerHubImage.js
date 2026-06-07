export const deleteDockerHubImage = async (
    imageName,
    dockerHubToken,
    axios
) => {
    const [repoPath, tag = "latest"] = imageName.split(":");

    const firstSlash = repoPath.indexOf("/");

    if (firstSlash === -1) {
        throw new Error("Invalid image name format");
    }

    const username = repoPath.slice(0, firstSlash);
    const repository = repoPath.slice(firstSlash + 1);

    const authRes = await axios.get(
        "https://hub.docker.com/v2/users/login/",
        {
            headers: {
                Authorization: `Bearer ${dockerHubToken}`
            }
        }
    );

    const jwt = authRes.data.token;

    await axios.delete(
        `https://hub.docker.com/v2/repositories/${username}/${repository}/tags/${tag}/`,
        {
            headers: {
                Authorization: `JWT ${jwt}`
            }
        }
    );

    return {
        success: true,
        imageName
    };
};