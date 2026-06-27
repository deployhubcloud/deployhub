export function buildTelegramSpikeAlertMessage({ projectId, current, previous, detectedAt }) {
    const multiplier = (current / previous).toFixed(1);
    return `🚨 *Traffic Spike Detected*\n\n` +
        `*Project:* \`${projectId}\`\n` +
        `*Previous:* ${previous} req/5min\n` +
        `*Current:* ${current} req/5min\n` +
        `*Spike:* ${multiplier}x increase\n` +
        `*Time:* ${new Date(detectedAt).toLocaleString()}`;
}