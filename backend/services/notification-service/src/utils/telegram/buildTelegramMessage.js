export const buildTelegramMessage = ({
    projectName,
    buildId,
    status,
    serviceType,
    deploymentUrl,
    logsUrl
}) => {

    const config = {

        "build-started": {
            emoji: "🏗️",
            title: "Build Started",
            message:
                "Source code received and build process has started."
        },

        "build-success": {
            emoji: "✅",
            title: "Build Successful",
            message:
                "Build completed successfully. Deployment is starting."
        },

        "build-failed": {
            emoji: "❌",
            title: "Build Failed",
            message:
                "Build process failed. Review logs for more information."
        },

        "deploy-success": {
            emoji: "🚀",
            title: "Deployment Successful",
            message:
                "Application deployed successfully and is now live."
        }
    };

    const current = config[status];

    let extra = "";

    if (
        (
            status === "build-success" ||
            status === "build-failed" ||
            status === "deploy-success"
        ) &&
        logsUrl
    ) {
        extra += `\n📄 Build Logs: ${logsUrl}`;
    }

    if (status === "deploy-success") {

        extra += `\n🔧 Service Type: ${serviceType}`;

        if (
            serviceType &&
            serviceType.toLowerCase() !== "microservice" &&
            deploymentUrl
        ) {
            extra += `\n🌍 Live URL: ${deploymentUrl}`;
        }
    }

    return `
${current.emoji} *${current.title}*

📦 Project: ${projectName}
🆔 Build ID: \`${buildId}\`

${current.message}

${extra}

━━━━━━━━━━━━━━━
⚡ DeployHub
`;
};