export function buildEmailSpikeAlertTemplate({ projectId, current, previous, detectedAt }) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🚨 Traffic Spike Detected</h2>
        <p>Your project <strong>${projectId}</strong> is experiencing unusual traffic.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
                <td style="padding: 8px; color: #6b7280;">Previous (5min)</td>
                <td style="padding: 8px; font-weight: bold;">${previous} requests</td>
            </tr>
            <tr style="background: #fef2f2;">
                <td style="padding: 8px; color: #6b7280;">Current (5min)</td>
                <td style="padding: 8px; font-weight: bold; color: #ef4444;">${current} requests</td>
            </tr>
            <tr>
                <td style="padding: 8px; color: #6b7280;">Spike</td>
                <td style="padding: 8px; font-weight: bold; color: #ef4444;">${(current / previous).toFixed(1)}x increase</td>
            </tr>
            <tr>
                <td style="padding: 8px; color: #6b7280;">Detected At</td>
                <td style="padding: 8px;">${new Date(detectedAt).toLocaleString()}</td>
            </tr>
        </table>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">DeployHub Monitoring</p>
    </div>
    `;
}