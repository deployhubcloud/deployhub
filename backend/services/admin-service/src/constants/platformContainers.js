export const PLATFORM_CONTAINERS = [
    {
        id: 'api-gateway',
        name: 'deployhubapigateway',
        label: 'API Gateway',
        group: 'edge',
        description: 'Public API entrypoint',
        critical: true,
    },
    {
        id: 'secrets-manager',
        name: 'deployhubsecretsmanager',
        label: 'Secrets Manager',
        group: 'backend',
        description: 'Runtime secrets bootstrap',
        critical: true,
    },
    {
        id: 'identity-service',
        name: 'deployhubidentityservice',
        label: 'Identity',
        group: 'backend',
        description: 'Auth, sessions, accounts',
    },
    {
        id: 'project-service',
        name: 'deployhubprojectservice',
        label: 'Project',
        group: 'backend',
        description: 'Projects, domains, SSL',
    },
    {
        id: 'build-service',
        name: 'deployhubbuildservice',
        label: 'Build',
        group: 'backend',
        description: 'Build workers',
    },
    {
        id: 'deploy-service',
        name: 'deployhubdeployservice',
        label: 'Deploy',
        group: 'backend',
        description: 'Deploy workers',
    },
    {
        id: 'analytics-service',
        name: 'deployhubanalyticsservice',
        label: 'Analytics',
        group: 'backend',
        description: 'Traffic summaries',
    },
    {
        id: 'notification-service',
        name: 'deployhubnotificationservice',
        label: 'Notification',
        group: 'backend',
        description: 'Email and alerts',
    },
    {
        id: 'stream-service',
        name: 'deployhubstreamservice',
        label: 'Stream',
        group: 'backend',
        description: 'Realtime websocket hub',
    },
    {
        id: 'agent-service',
        name: 'deployhubagentservice',
        label: 'Agent',
        group: 'backend',
        description: 'AI operator',
    },
    {
        id: 'admin-service',
        name: 'deployhubadminservice',
        label: 'Admin API',
        group: 'backend',
        description: 'This control-plane API',
        self: true,
        critical: true,
    },
    {
        id: 'marketing-frontend',
        name: 'deployhub',
        label: 'Marketing site',
        group: 'frontend',
        description: 'deployhub.cloud',
    },
    {
        id: 'dashboard-frontend',
        name: 'appdeployhub',
        label: 'Dashboard',
        group: 'frontend',
        description: 'dashboard.deployhub.cloud',
    },
    {
        id: 'admin-frontend',
        name: 'adminfrontend',
        label: 'Admin UI',
        group: 'frontend',
        description: 'admin.deployhub.cloud',
        critical: true,
    },
];

export const CONTAINER_BY_ID = Object.fromEntries(PLATFORM_CONTAINERS.map((c) => [c.id, c]));
export const CONTAINER_BY_NAME = Object.fromEntries(PLATFORM_CONTAINERS.map((c) => [c.name, c]));

export const HOST_PROCESSES = [
    { id: 'user-router', label: 'User router', note: 'Runs on host (PM2), not Docker' },
    { id: 'monitoring-service', label: 'Monitoring', note: 'Runs on host, not Docker' },
];
