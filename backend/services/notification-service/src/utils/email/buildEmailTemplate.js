export const buildEmailTemplate = ({
    userName,
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
            color: "#2563eb",
            message:
                "Your project build has started and is currently being processed."
        },

        "build-success": {
            emoji: "✅",
            title: "Build Successful",
            color: "#22c55e",
            message:
                "Build completed successfully. Deployment has started."
        },

        "build-failed": {
            emoji: "❌",
            title: "Build Failed",
            color: "#dc2626",
            message:
                "Your build failed. Please review the build logs."
        },

        "deploy-success": {
            emoji: "🚀",
            title: "Deployment Successful",
            color: "#16a34a",
            message:
                "Your application has been successfully deployed and is now live."
        }
    };

    const current = config[status];

    let extraRows = "";
    let actionButton = "";

    if (
        (
            status === "build-success" ||
            status === "build-failed" ||
            status === "deploy-success"
        ) &&
        logsUrl
    ) {

        extraRows += `
            <tr>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <strong>Build Logs</strong>
                </td>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <a href="${logsUrl}">
                        View Build Logs
                    </a>
                </td>
            </tr>
        `;

        const buttonColor =
            status === "build-failed"
                ? "#dc2626"
                : "#22c55e";

        actionButton = `
            <a
                href="${logsUrl}"
                style="
                    display:inline-block;
                    padding:12px 22px;
                    background:${buttonColor};
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:600;
                "
            >
                View Build Logs
            </a>
        `;
    }

    if (status === "deploy-success") {

        extraRows += `
            <tr>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <strong>Service Type</strong>
                </td>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    ${serviceType || "N/A"}
                </td>
            </tr>
        `;

        if (
            serviceType &&
            serviceType.toLowerCase() !== "microservice" &&
            deploymentUrl
        ) {

            extraRows += `
                <tr>
                    <td style="border:1px solid #e5e7eb;padding:12px;">
                        <strong>Live URL</strong>
                    </td>
                    <td style="border:1px solid #e5e7eb;padding:12px;">
                        <a href="${deploymentUrl}">
                            ${deploymentUrl}
                        </a>
                    </td>
                </tr>
            `;

            actionButton += `
                <div style="margin-top:12px;">
                    <a
                        href="${deploymentUrl}"
                        style="
                            display:inline-block;
                            padding:12px 22px;
                            background:#16a34a;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:8px;
                            font-weight:600;
                        "
                    >
                        Open Application
                    </a>
                </div>
            `;
        }
    }

    return `
<div
    style="
        max-width:700px;
        margin:auto;
        font-family:Arial,sans-serif;
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:14px;
        overflow:hidden;
    "
>

    <div
        style="
            background:${current.color};
            color:white;
            padding:28px;
            text-align:center;
        "
    >
        <h1 style="margin:0;">
            ${current.emoji} ${current.title}
        </h1>
    </div>

    <div style="padding:32px;">

        <p>
            Hello ${userName || "Developer"},
        </p>

        <p>
            ${current.message}
        </p>

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
                margin-top:24px;
                border-collapse:collapse;
            "
        >
            <tr>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <strong>Project</strong>
                </td>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    ${projectName}
                </td>
            </tr>

            <tr>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <strong>Build ID</strong>
                </td>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    ${buildId}
                </td>
            </tr>

            <tr>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    <strong>Status</strong>
                </td>
                <td style="border:1px solid #e5e7eb;padding:12px;">
                    ${current.title}
                </td>
            </tr>

            ${extraRows}

        </table>

        ${actionButton
            ? `
                <div
                    style="
                        margin-top:30px;
                        text-align:center;
                    "
                >
                    ${actionButton}
                </div>
                `
            : ""
        }

        <p
            style="
                margin-top:32px;
                color:#6b7280;
                font-size:13px;
            "
        >
            DeployHub is monitoring your deployment lifecycle and will notify you about important project events.
        </p>

    </div>

</div>
`;
};