export function buildDiscordSpikeAlertMessage({ projectId, current, previous, detectedAt }) {
    const multiplier = (current / previous).toFixed(1);
    return {
        embeds: [{
            title: '🚨 Traffic Spike Detected',
            color: 0xef4444,
            fields: [
                { name: 'Project', value: `\`${projectId}\``, inline: true },
                { name: 'Spike', value: `${multiplier}x increase`, inline: true },
                { name: 'Previous', value: `${previous} req/5min`, inline: true },
                { name: 'Current', value: `${current} req/5min`, inline: true },
                { name: 'Detected At', value: new Date(detectedAt).toLocaleString(), inline: false },
            ],
            timestamp: new Date().toISOString(),
        }]
    };
}