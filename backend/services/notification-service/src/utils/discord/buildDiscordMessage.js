export const buildDiscordMessage = ({
    projectName,
    buildId,
    status
}) => {

    const config = {
        building: {
            emoji: "🚀",
            title: "Build Started",
            message: "Your build has started and is currently running."
        },

        success: {
            emoji: "✅",
            title: "Deployment Successful",
            message: "Your deployment completed successfully."
        },

        failed: {
            emoji: "❌",
            title: "Deployment Failed",
            message: "Your deployment failed. Please check your logs."
        }
    };

    const current =
        config[status] || {
            emoji: "ℹ️",
            title: "Status Update",
            message: "Project status changed."
        };

    return `
${current.emoji} ${current.title}

📦 Project: ${projectName}
🆔 Build ID: ${buildId}

${current.message}
`;
};