import { Type } from '@google/genai';

const confirmed = {
    confirmed: {
        type: Type.BOOLEAN,
        description: 'Must be true only after the user explicitly confirmed this destructive action',
    },
};

export const toolDeclarations = [
    {
        name: 'list_projects',
        description: 'List all projects owned by the current user (id, name, type, status, plan, domain, builds).',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'find_project',
        description: 'Find a project by name (case-insensitive partial match). Use when the user mentions a project by name instead of id.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'Project name or fragment' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_project_overview',
        description: 'Get overview: status, domain, repo, branch, commands, monitor, notifications, latest build summary.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_settings',
        description: 'Get settings (commands, port, monitor, notifications). Env values are hidden; only env key names are returned.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_live_status',
        description: 'Get live deploy/runtime status from Redis (queued, building, deploying, running, failed, etc.).',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_domain_settings',
        description: 'Get subdomain and custom domains for a project.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_billing',
        description: 'Get plan, payment status, dates, and billing history for a project.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'list_plans',
        description: 'List available DeployHub pricing plans and their features.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'get_analytics_summary',
        description: 'Traffic analytics for a project: requests (5m/1h/24h), 4xx/5xx errors, unique visitors, top countries and endpoints.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },

    // ── builds & logs ─────────────────────────────────────────
    {
        name: 'list_all_builds',
        description: 'List recent builds across all of the user\'s projects.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'list_project_builds',
        description: 'List builds for one project (newest first).',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_failed_builds',
        description: 'List recent failed builds for the user, optionally filtered to one project.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: 'Optional project filter' },
                limit: { type: Type.NUMBER, description: 'Max results (default 10)' },
            },
        },
    },
    {
        name: 'get_build_logs',
        description: 'Fetch stored build log text. Pass logsUrl if known; otherwise uses latest build with a log URL.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                logsUrl: { type: Type.STRING },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_runtime_logs',
        description: 'Fetch recent Docker container / runtime logs for a backend project.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                tail: { type: Type.NUMBER, description: 'Lines to fetch (default 150, max 500)' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_deploy_cache_info',
        description: 'Read Redis deploy cache for a project (latest buildId, container name, type, logsUrl).',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },

    // ── smart composites ──────────────────────────────────────
    {
        name: 'diagnose_project',
        description:
            'One-shot health check: live status, overview snapshot, recent builds, analytics errors, and a short runtime/build log sample if available. Prefer this when the user asks why a project is down, broken, or failing.',
        parameters: {
            type: Type.OBJECT,
            properties: { projectId: { type: Type.STRING } },
            required: ['projectId'],
        },
    },
    {
        name: 'account_summary',
        description:
            'High-level account snapshot: project count by status/type/plan, recent failed builds count, and profile basics if auth is available.',
        parameters: { type: Type.OBJECT, properties: {} },
    },

    // ── identity (JWT forwarded) ──────────────────────────────
    {
        name: 'get_user_profile',
        description: 'Get the logged-in user profile (name, email, provider).',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'list_sessions',
        description: 'List active login sessions for the current user.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'list_github_repos',
        description: 'List GitHub repos the user can deploy (requires GitHub-linked account). Returns name, private, default branch, url.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'Optional name filter' },
                limit: { type: Type.NUMBER, description: 'Max repos to return (default 30)' },
            },
        },
    },

    // ── write / destructive (need confirmed=true) ─────────────
    {
        name: 'redeploy_project',
        description: 'DESTRUCTIVE. Queue a redeploy. Ask yes/no first; set confirmed=true only after explicit yes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'update_build_and_start_settings',
        description: 'DESTRUCTIVE. Update build/start settings. confirmed=true only after user agrees.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                buildCommand: { type: Type.STRING },
                publishDir: { type: Type.STRING },
                startCommand: { type: Type.STRING },
                port: { type: Type.NUMBER },
                rootDirectory: { type: Type.STRING },
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'update_env_settings',
        description: 'DESTRUCTIVE. Replace ALL env vars with envJson (JSON string). confirmed=true only after user agrees.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                envJson: { type: Type.STRING },
            },
            required: ['projectId', 'envJson', 'confirmed'],
        },
    },
    {
        name: 'update_monitoring_and_notifications',
        description: 'DESTRUCTIVE. Update monitoring/notifications. confirmed=true only after user agrees.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                projectPlan: { type: Type.STRING },
                monitor: {
                    type: Type.OBJECT,
                    properties: {
                        enabled: { type: Type.BOOLEAN },
                        intervalSeconds: { type: Type.NUMBER },
                        healthPath: { type: Type.STRING },
                        failedTries: { type: Type.NUMBER },
                    },
                },
                notifications: {
                    type: Type.OBJECT,
                    properties: {
                        email: {
                            type: Type.OBJECT,
                            properties: {
                                enabled: { type: Type.BOOLEAN },
                                emailAddress: { type: Type.STRING },
                            },
                        },
                        discord: {
                            type: Type.OBJECT,
                            properties: {
                                enabled: { type: Type.BOOLEAN },
                                webhookUrl: { type: Type.STRING },
                            },
                        },
                        telegram: {
                            type: Type.OBJECT,
                            properties: {
                                enabled: { type: Type.BOOLEAN },
                                botToken: { type: Type.STRING },
                                chatId: { type: Type.STRING },
                            },
                        },
                    },
                },
            },
            required: ['projectId', 'projectPlan', 'monitor', 'confirmed'],
        },
    },
    {
        name: 'change_subdomain',
        description: 'DESTRUCTIVE. Change project subdomain. Need oldSubdomain + newSubdomain. confirmed=true after yes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                oldSubdomain: { type: Type.STRING },
                newSubdomain: { type: Type.STRING },
            },
            required: ['projectId', 'oldSubdomain', 'newSubdomain', 'confirmed'],
        },
    },
    {
        name: 'add_custom_domain',
        description: 'DESTRUCTIVE. Attach a custom domain. confirmed=true after yes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                domain: { type: Type.STRING },
            },
            required: ['projectId', 'domain', 'confirmed'],
        },
    },
    {
        name: 'remove_custom_domain',
        description: 'DESTRUCTIVE. Remove a custom domain. confirmed=true after yes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
                domain: { type: Type.STRING },
            },
            required: ['projectId', 'domain', 'confirmed'],
        },
    },
    {
        name: 'delete_project',
        description: 'DESTRUCTIVE / IRREVERSIBLE. Soft-delete a project. Always name the project and get explicit confirmation first.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                ...confirmed,
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'revoke_session',
        description: 'DESTRUCTIVE. Revoke one login session by tokenId. confirmed=true after yes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                tokenId: { type: Type.STRING },
                ...confirmed,
            },
            required: ['tokenId', 'confirmed'],
        },
    },
    {
        name: 'revoke_all_sessions',
        description: 'DESTRUCTIVE. Log out all sessions. confirmed=true after yes.',
        parameters: {
            type: Type.OBJECT,
            properties: { ...confirmed },
            required: ['confirmed'],
        },
    },
];
