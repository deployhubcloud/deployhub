export const buildTelegramMessage = ({
    projectName,
    buildId,
    status
}) => {

    const config = {
        building: {
            emoji: "🚀",
            title: "Build Started",
            message: "Build is now running."
        },

        success: {
            emoji: "✅",
            title: "Deployment Successful",
            message: "Your application is now live."
        },

        failed: {
            emoji: "❌",
            title: "Deployment Failed",
            message: "Deployment failed. Check logs."
        }
    };

    const current = config[status];

    return `
${current.emoji} *${current.title}*

📦 Project: ${projectName}
🆔 Build ID: ${buildId}

${current.message}
`;
};