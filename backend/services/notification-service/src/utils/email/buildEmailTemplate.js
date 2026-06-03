export const buildEmailTemplate = ({
    userName,
    projectName,
    buildId,
    status
}) => {

    const config = {
        building: {
            emoji: "🚀",
            title: "Build Started",
            color: "#2563eb",
            message:
                "Your project build has started and is currently being processed."
        },

        success: {
            emoji: "✅",
            title: "Deployment Successful",
            color: "#16a34a",
            message:
                "Your project has been deployed successfully and is now live."
        },

        failed: {
            emoji: "❌",
            title: "Deployment Failed",
            color: "#dc2626",
            message:
                "Your deployment failed. Please review the build logs."
        }
    };

    const current = config[status];

    return `
<div style="
    max-width:650px;
    margin:auto;
    font-family:Arial,sans-serif;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:12px;
    overflow:hidden;
">

    <div style="
        background:${current.color};
        padding:24px;
        text-align:center;
        color:white;
    ">
        <h1 style="margin:0;">
            ${current.emoji} ${current.title}
        </h1>
    </div>

    <div style="padding:30px;">

        <p>
            Hello ${userName || "Developer"},
        </p>

        <p>
            ${current.message}
        </p>

        <table
            width="100%"
            cellpadding="12"
            style="
                border-collapse:collapse;
                margin-top:20px;
            "
        >
            <tr>
                <td style="border:1px solid #ddd;">
                    <strong>Project</strong>
                </td>
                <td style="border:1px solid #ddd;">
                    ${projectName}
                </td>
            </tr>

            <tr>
                <td style="border:1px solid #ddd;">
                    <strong>Build ID</strong>
                </td>
                <td style="border:1px solid #ddd;">
                    ${buildId}
                </td>
            </tr>

            <tr>
                <td style="border:1px solid #ddd;">
                    <strong>Status</strong>
                </td>
                <td style="border:1px solid #ddd;">
                    ${status.toUpperCase()}
                </td>
            </tr>
        </table>

        <p style="
            margin-top:24px;
            color:#6b7280;
        ">
            DeployHub will continue to keep you updated about your project's deployment lifecycle.
        </p>
    </div>

</div>
`;
};