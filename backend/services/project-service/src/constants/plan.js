export const free = {
    name: 'free',
    price: 0,
    deployment_Type: ['static'],
    subdomain: true,
    customDomain: false,
    ssl: true,
    github_Ci_Cd: false,
    ai_dignostics: false,
    uptime_monitoring: false,
}

export const starter = {
    name: 'starter',
    price: 9.99,
    deployment_Type: ['static', 'node', 'go', 'python'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    github_Ci_Cd: true,
    ai_dignostics: false,
    uptime_monitoring: false,
    resources: {
        ram: '256mb',
        cpu: '0.5',
        storage: '5120'
    }
}

export const pro = {
    name: 'pro',
    price: 29.99,
    deployment_Type: ['static', 'node', 'go', 'python', 'java'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    github_Ci_Cd: true,
    ai_dignostics: true,
    uptime_monitoring: true,
    resources: {
        ram: '512mb',
        cpu: '1',
        storage: '10240'
    }
}