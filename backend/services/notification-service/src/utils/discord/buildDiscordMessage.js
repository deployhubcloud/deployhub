export const buildDiscordMessage = ({
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
        },

        "crash": {
            emoji: "💥",
            title: "Application Crashed",
            color: "#dc2626",
            message:
                "Your application has stopped responding and appears to have crashed. DeployHub is attempting automatic recovery."
        },

        "recovered": {
            emoji: "🔄",
            title: "Application Recovered",
            message:
                "Your application has successfully recovered from the crash and is now running normally."
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

    if (status === "crash") {
        extra += `\n🚨 Status: Service Unavailable! Please See Your Live Logs on Deployhub`;
    }

    // For crash and recovered, we do not show buildId
    const buildIdLine = (status !== "crash" && status !== "recovered")
        ? `🆔 Build ID: ${buildId}`
        : "";

    return `
${current.emoji} **${current.title}**

📦 Project: ${projectName}
${buildIdLine}

${current.message}

${extra}

━━━━━━━━━━━━━━━━━━━━
⚡ Powered by DeployHub
`;
};