const confirmed = {
    confirmed: {
        type: 'boolean',
        description: 'Must be true only after the user explicitly confirmed this destructive action',
    },
};


export const toolDeclarations = [
    {
        name: 'list_projects',
        description:
            'List all projects owned by the current user (id, name, type, status, plan, domain, builds). Use only when the user asks about their projects, wants a list, or you need to discover projects for a real task — never for greetings/small talk.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'find_project',
        description:
            'Resolve project name → id (case-insensitive partial match). Call this first when the user names a project; then call other tools in parallel with the returned projectId.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Project name or fragment' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_project_overview',
        description: 'Get overview: status, domain, repo, branch, commands, monitor, notifications, latest build summary.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_settings',
        description: 'Get settings (commands, port, monitor, notifications). Env values are hidden; only env key names are returned.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_live_status',
        description:
            'Get live deploy/runtime status from Redis (queued, building, deploying, running, failed, etc.). Safe to call in parallel with analytics/uptime/builds when projectId is known.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_domain_settings',
        description: 'Get subdomain and custom domains for a project.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_billing',
        description: 'Get plan, payment status, dates, and billing history for a project.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'list_plans',
        description: 'List available DeployHub pricing plans and their features.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_analytics_summary',
        description:
            'Traffic analytics for a project: requests (5m/1h/24h), 4xx/5xx errors, unique visitors, top countries and endpoints. Can run in parallel with status/uptime tools.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'list_all_builds',
        description: "List recent builds across all of the user's projects.",
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'list_project_builds',
        description: 'List builds for one project (newest first).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_failed_builds',
        description: 'List recent failed builds for the user, optionally filtered to one project.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'Optional project filter' },
                limit: { type: 'number', description: 'Max results (default 10)' },
            },
        },
    },
    {
        name: 'get_build_logs',
        description: 'Fetch stored build log text. Pass logsUrl if known; otherwise uses latest build with a log URL.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                logsUrl: { type: 'string' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_runtime_logs',
        description: 'Fetch recent Docker container / runtime logs for a backend project.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                tail: { type: 'number', description: 'Lines to fetch (default 150, max 500)' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_deploy_cache_info',
        description: 'Read Redis deploy cache for a project (latest buildId, container name, type, logsUrl).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'diagnose_project',
        description:
            'Preferred one-shot health check when a project is down/broken/failing: live status, overview, recent builds, analytics errors, and a short log sample. Prefer this over calling many status/log tools separately.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'account_summary',
        description:
            'High-level account snapshot: project count by status/type/plan, recent failed builds count, and profile basics if auth is available. Use only when the user asks for an overview/summary — not for greetings.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_user_profile',
        description: 'Get the logged-in user profile (name, email, provider).',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'list_sessions',
        description: 'List active login sessions for the current user.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'list_github_repos',
        description: 'List GitHub repos the user can deploy (requires GitHub-linked account). Returns name, private, default branch, url.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Optional name filter' },
                limit: { type: 'number', description: 'Max repos to return (default 30)' },
            },
        },
    },
    {
        name: 'redeploy_project',
        description: 'DESTRUCTIVE. Queue a redeploy. Ask yes/no first; set confirmed=true only after explicit yes.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'update_build_and_start_settings',
        description: 'DESTRUCTIVE. Update build/start settings. confirmed=true only after user agrees.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                buildCommand: { type: 'string' },
                publishDir: { type: 'string' },
                startCommand: { type: 'string' },
                port: { type: 'number' },
                rootDirectory: { type: 'string' },
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'update_env_settings',
        description: 'DESTRUCTIVE. Replace ALL env vars with envJson (JSON string). confirmed=true only after user agrees.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                envJson: { type: 'string' },
            },
            required: ['projectId', 'envJson', 'confirmed'],
        },
    },
    {
        name: 'update_monitoring_and_notifications',
        description: 'DESTRUCTIVE. Update monitoring/notifications. confirmed=true only after user agrees.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                projectPlan: { type: 'string' },
                monitor: {
                    type: 'object',
                    properties: {
                        enabled: { type: 'boolean' },
                        intervalSeconds: { type: 'number' },
                        healthPath: { type: 'string' },
                        failedTries: { type: 'number' },
                    },
                },
                notifications: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'object',
                            properties: {
                                enabled: { type: 'boolean' },
                                emailAddress: { type: 'string' },
                            },
                        },
                        discord: {
                            type: 'object',
                            properties: {
                                enabled: { type: 'boolean' },
                                webhookUrl: { type: 'string' },
                            },
                        },
                        telegram: {
                            type: 'object',
                            properties: {
                                enabled: { type: 'boolean' },
                                botToken: { type: 'string' },
                                chatId: { type: 'string' },
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
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                oldSubdomain: { type: 'string' },
                newSubdomain: { type: 'string' },
            },
            required: ['projectId', 'oldSubdomain', 'newSubdomain', 'confirmed'],
        },
    },
    {
        name: 'add_custom_domain',
        description: 'DESTRUCTIVE. Attach a custom domain. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                domain: { type: 'string' },
            },
            required: ['projectId', 'domain', 'confirmed'],
        },
    },
    {
        name: 'remove_custom_domain',
        description: 'DESTRUCTIVE. Remove a custom domain. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                domain: { type: 'string' },
            },
            required: ['projectId', 'domain', 'confirmed'],
        },
    },
    {
        name: 'delete_project',
        description: 'DESTRUCTIVE / IRREVERSIBLE. Soft-delete a project. Always name the project and get explicit confirmation first.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
            },
            required: ['projectId', 'confirmed'],
        },
    },
    {
        name: 'revoke_session',
        description: 'DESTRUCTIVE. Revoke one login session by tokenId. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                tokenId: { type: 'string' },
                ...confirmed,
            },
            required: ['tokenId', 'confirmed'],
        },
    },
    {
        name: 'revoke_all_sessions',
        description: 'DESTRUCTIVE. Log out all sessions. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: { ...confirmed },
            required: ['confirmed'],
        },
    },


    {
        name: 'get_project_meta',
        description: 'Get lightweight project meta (name, plan, type).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'list_projects_filtered',
        description: 'List projects filtered by status, type, and/or plan.',
        parameters: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                type: { type: 'string', description: 'static|node|python|go|java' },
                plan: { type: 'string', description: 'free|starter|pro' },
            },
        },
    },
    {
        name: 'get_build_details',
        description: 'Get a single build record by buildId (status, commit, timings, logUrl).',
        parameters: {
            type: 'object',
            properties: {
                buildId: { type: 'string' },
                projectId: { type: 'string', description: 'Optional ownership check' },
            },
            required: ['buildId'],
        },
    },
    {
        name: 'get_latest_build_id',
        description: 'Get the latest build id for a project.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_monitoring_status',
        description: 'Get uptime-monitoring schedule from Redis (ping URL, interval, next ping).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_notification_settings',
        description: 'Get notification channel config for a project (secrets partially redacted).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'check_fleet_health',
        description:
            'Check live status for ALL user projects in one shot. Only when the user asks if projects are down / fleet health / status of everything — never on greetings.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'compare_projects',
        description:
            'Compare two owned projects (type, plan, status, builds, live status). Resolve both names with find_project first if needed, then call this once.',
        parameters: {
            type: 'object',
            properties: {
                projectIdA: { type: 'string' },
                projectIdB: { type: 'string' },
            },
            required: ['projectIdA', 'projectIdB'],
        },
    },
    {
        name: 'analyze_build_failure',
        description:
            'Fetch the latest failed build logs for a project and extract error/warning lines for diagnosis.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'explain_plan',
        description: 'Explain what a DeployHub plan includes (price, types, domains, monitoring). Pass plan name or omit for all.',
        parameters: {
            type: 'object',
            properties: {
                plan: { type: 'string', description: 'free|starter|pro' },
            },
        },
    },
    {
        name: 'upsert_env_vars',
        description:
            'DESTRUCTIVE. Merge/update specific env keys (does not wipe unrelated keys). Pass patchJson as JSON object string. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                patchJson: { type: 'string', description: 'JSON object of keys to set/overwrite' },
                removeKeysJson: {
                    type: 'string',
                    description: 'Optional JSON array of env keys to remove',
                },
            },
            required: ['projectId', 'patchJson', 'confirmed'],
        },
    },
    {
        name: 'create_free_project',
        description:
            'DESTRUCTIVE. Create a FREE static project only (paid plans need dashboard payment). Ask confirmation first. Required: projectName, version (22|24), repoUrl, branch, buildCommand, publishDir.',
        parameters: {
            type: 'object',
            properties: {
                ...confirmed,
                projectName: { type: 'string' },
                version: { type: 'string', description: '22 or 24' },
                repoUrl: { type: 'string' },
                branch: { type: 'string' },
                rootDirectory: { type: 'string' },
                buildCommand: { type: 'string' },
                publishDir: { type: 'string' },
                subdomain: { type: 'string' },
                envJson: { type: 'string', description: 'Optional env JSON object string' },
            },
            required: [
                'confirmed',
                'projectName',
                'version',
                'repoUrl',
                'branch',
                'buildCommand',
                'publishDir',
            ],
        },
    },
    {
        name: 'update_display_name',
        description: 'DESTRUCTIVE. Update the logged-in user display/full name. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                ...confirmed,
                fullname: { type: 'string' },
            },
            required: ['fullname', 'confirmed'],
        },
    },
    {
        name: 'get_build_stats',
        description: 'Get success/failed/pending build counts for a project (user-owned only).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_latest_build',
        description: 'Get the latest build object for a project (status, commit, logsUrl).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_live_status_api',
        description: 'Get live + DB status via project-service secured /status API.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_env_keys',
        description: 'List environment variable KEY names only (values never returned).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'merge_env_vars',
        description:
            'DESTRUCTIVE. Secure merge endpoint: patch/remove env keys without wiping others. Pass patchJson object string. confirmed=true after yes.',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                ...confirmed,
                patchJson: { type: 'string' },
                removeKeysJson: { type: 'string', description: 'Optional JSON array of keys to remove' },
            },
            required: ['projectId', 'patchJson', 'confirmed'],
        },
    },
    {
        name: 'list_deployments',
        description: 'List recent deployments for a project (status, buildId, deployedAt).',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                limit: { type: 'number' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_latest_deployment',
        description: 'Get the latest deployment for a project.',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_uptime_status',
        description: 'Get monitoring/uptime schedule + lastDownAt for a project (ownership verified).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },
    {
        name: 'get_analytics_health_score',
        description: 'Get traffic health score/grade from analytics (errors vs requests).',
        parameters: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
        },
    },

    {
        name: 'probe_url',
        description:
            'HTTP probe a public URL from outside (status, latency, redirect, body snippet). Use with diagnose/live status when a site seems down — compares internal "running" vs external reachability. SSRF-safe (public hosts only).',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'Full http(s) URL to probe' },
                method: { type: 'string', description: 'GET (default) or HEAD' },
            },
            required: ['url'],
        },
    },
    {
        name: 'check_dns',
        description:
            'Resolve DNS for a hostname (A/AAAA/CNAME/MX/TXT/NS). Use for custom domain / subdomain issues.',
        parameters: {
            type: 'object',
            properties: {
                hostname: { type: 'string', description: 'Hostname or URL' },
            },
            required: ['hostname'],
        },
    },
    {
        name: 'check_ssl',
        description:
            'Check TLS certificate for a hostname (issuer, validity, days remaining, auth errors). Use for HTTPS/cert problems.',
        parameters: {
            type: 'object',
            properties: {
                hostname: { type: 'string' },
                port: { type: 'number', description: 'Default 443' },
            },
            required: ['hostname'],
        },
    },
    {
        name: 'search_error_docs',
        description:
            'Web search for an error message / build failure to find docs and fix hints. Pass a short error line from logs. Mix with analyze_build_failure results.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Error text or search query' },
                maxResults: { type: 'number' },
            },
            required: ['query'],
        },
    },
    {
        name: 'lookup_npm_package',
        description: 'Look up an npm package (latest version, deprecated, license, deps).',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Package name, e.g. express or @scope/pkg' },
                version: { type: 'string', description: 'Optional exact version' },
            },
            required: ['name'],
        },
    },
    {
        name: 'lookup_pypi_package',
        description: 'Look up a PyPI package (version, summary, requires-python).',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string' },
            },
            required: ['name'],
        },
    },
    {
        name: 'lookup_domain_whois',
        description:
            'RDAP/WHOIS-style domain registration info (expiry, nameservers, status). Use for custom domain ownership/expiry questions.',
        parameters: {
            type: 'object',
            properties: {
                domain: { type: 'string', description: 'example.com' },
            },
            required: ['domain'],
        },
    },
    {
        name: 'fetch_public_page',
        description:
            'Fetch a public docs/status/changelog page snippet (http/https only, SSRF-safe).',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                maxChars: { type: 'number' },
            },
            required: ['url'],
        },
    },
    {
        name: 'get_github_repo_insights',
        description:
            'GitHub insights for owner/repo: latest commits, open PRs, recent Actions runs. Requires user GitHub login. Mix with DeployHub build status to see if code pushed vs deploy failed.',
        parameters: {
            type: 'object',
            properties: {
                repo: { type: 'string', description: 'owner/name' },
                branch: { type: 'string', description: 'Optional branch (default: repo default)' },
            },
            required: ['repo'],
        },
    },
];

export const groqTools = toolDeclarations.map((t) => ({
    type: 'function',
    function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
    },
}));
