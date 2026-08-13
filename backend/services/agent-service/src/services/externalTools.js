import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';
import { URL } from 'url';

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_BODY_CHARS = 2500;

function withTimeout(promise, ms, label = 'request') {
    let timer;
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        }),
    ]);
}

function isPrivateIp(ip) {
    if (!ip) return true;
    const v = String(ip).toLowerCase();
    if (v === '::1' || v === '0.0.0.0') return true;
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;

    if (net.isIPv4(v)) {
        const parts = v.split('.').map(Number);
        const [a, b] = parts;
        if (a === 10 || a === 127 || a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
    }
    return false;
}

function assertSafePublicUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(String(rawUrl || '').trim());
    } catch {
        throw new Error('Invalid URL');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http/https URLs are allowed');
    }
    const host = parsed.hostname.toLowerCase();
    if (
        host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host === 'metadata.google.internal'
    ) {
        throw new Error('Blocked host (private/local)');
    }
    if (net.isIP(host) && isPrivateIp(host)) {
        throw new Error('Blocked private IP');
    }
    return parsed;
}

async function assertPublicHostname(hostname) {
    const host = String(hostname || '').toLowerCase();
    if (!host) throw new Error('hostname required');
    if (net.isIP(host)) {
        if (isPrivateIp(host)) throw new Error('Blocked private IP');
        return [host];
    }
    if (
        host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
    ) {
        throw new Error('Blocked host (private/local)');
    }

    const results = await dns.lookup(host, { all: true, verbatim: true });
    if (!results.length) throw new Error('DNS lookup returned no addresses');
    for (const r of results) {
        if (isPrivateIp(r.address)) {
            throw new Error(`Blocked: hostname resolves to private IP ${r.address}`);
        }
    }
    return results.map((r) => r.address);
}

function normalizeHostname(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    try {
        if (raw.includes('://')) return new URL(raw).hostname;
    } catch {
    }
    return raw.replace(/^\.+/, '').split('/')[0].split(':')[0].toLowerCase();
}


export async function probeUrl(url, { method = 'GET', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const parsed = assertSafePublicUrl(url);
    await assertPublicHostname(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();

    try {
        const res = await fetch(parsed.toString(), {
            method: String(method || 'GET').toUpperCase() === 'HEAD' ? 'HEAD' : 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'DeployHub-AgentProbe/1.0',
                Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
            },
        });
        const latencyMs = Date.now() - started;
        let bodySnippet = null;
        if (method.toUpperCase() !== 'HEAD') {
            const text = await res.text();
            bodySnippet = text.slice(0, MAX_BODY_CHARS);
        }

        return {
            ok: true,
            url: parsed.toString(),
            finalUrl: res.url,
            status: res.status,
            statusText: res.statusText,
            okHttp: res.ok,
            latencyMs,
            redirected: res.redirected || res.url !== parsed.toString(),
            contentType: res.headers.get('content-type'),
            server: res.headers.get('server'),
            bodySnippet,
        };
    } catch (error) {
        return {
            ok: false,
            url: parsed.toString(),
            latencyMs: Date.now() - started,
            message: error.name === 'AbortError' ? `Timed out after ${timeoutMs}ms` : error.message,
        };
    } finally {
        clearTimeout(timer);
    }
}


export async function checkDns(hostnameOrUrl) {
    const hostname = normalizeHostname(hostnameOrUrl);
    if (!hostname) return { ok: false, message: 'hostname is required' };
    await assertPublicHostname(hostname);

    const resolve = async (type, fn) => {
        try {
            return { type, records: await fn(hostname) };
        } catch (error) {
            return { type, records: [], error: error.code || error.message };
        }
    };

    const [a, aaaa, cname, mx, txt, ns] = await Promise.all([
        resolve('A', (h) => dns.resolve4(h)),
        resolve('AAAA', (h) => dns.resolve6(h)),
        resolve('CNAME', (h) => dns.resolveCname(h)),
        resolve('MX', (h) => dns.resolveMx(h)),
        resolve('TXT', async (h) => {
            const rows = await dns.resolveTxt(h);
            return rows.map((parts) => parts.join(''));
        }),
        resolve('NS', (h) => dns.resolveNs(h)),
    ]);

    return {
        ok: true,
        hostname,
        A: a.records,
        AAAA: aaaa.records,
        CNAME: cname.records,
        MX: mx.records,
        TXT: (txt.records || []).slice(0, 10),
        NS: ns.records,
        notes: [a, aaaa, cname, mx, txt, ns]
            .filter((x) => x.error)
            .map((x) => `${x.type}: ${x.error}`),
    };
}


export async function checkSsl(hostnameOrUrl, { port = 443, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const hostname = normalizeHostname(hostnameOrUrl);
    if (!hostname) return { ok: false, message: 'hostname is required' };
    await assertPublicHostname(hostname);

    const sockPort = Number(port) || 443;

    try {
        const cert = await withTimeout(
            new Promise((resolve, reject) => {
                const socket = tls.connect(
                    {
                        host: hostname,
                        port: sockPort,
                        servername: hostname,
                        rejectUnauthorized: false,
                    },
                    () => {
                        const peer = socket.getPeerCertificate(true);
                        const authorized = socket.authorized;
                        const authError = socket.authorizationError || null;
                        socket.end();
                        if (!peer || !Object.keys(peer).length) {
                            reject(new Error('No certificate presented'));
                            return;
                        }
                        resolve({ peer, authorized, authError });
                    }
                );
                socket.on('error', reject);
            }),
            timeoutMs,
            'ssl'
        );

        const { peer, authorized, authError } = cert;
        const validFrom = peer.valid_from ? new Date(peer.valid_from) : null;
        const validTo = peer.valid_to ? new Date(peer.valid_to) : null;
        const now = Date.now();
        const daysRemaining =
            validTo && !Number.isNaN(validTo.getTime())
                ? Math.floor((validTo.getTime() - now) / (24 * 60 * 60 * 1000))
                : null;

        return {
            ok: true,
            hostname,
            port: sockPort,
            authorized,
            authorizationError: authError || null,
            subject: peer.subject,
            issuer: peer.issuer,
            subjectAltName: peer.subjectaltname || null,
            validFrom: peer.valid_from || null,
            validTo: peer.valid_to || null,
            daysRemaining,
            expired: typeof daysRemaining === 'number' ? daysRemaining < 0 : null,
            fingerprint256: peer.fingerprint256 || peer.fingerprint || null,
            serialNumber: peer.serialNumber || null,
        };
    } catch (error) {
        return { ok: false, hostname, message: error.message };
    }
}


export async function searchWeb(query, { maxResults = 5 } = {}) {
    const q = String(query || '').trim();
    if (!q) return { ok: false, message: 'query is required' };
    if (q.length > 300) return { ok: false, message: 'query too long' };

    const limit = Math.min(Math.max(Number(maxResults) || 5, 1), 8);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

    try {
        const res = await withTimeout(
            fetch(url, {
                headers: {
                    'User-Agent': 'DeployHub-AgentSearch/1.0',
                    Accept: 'text/html',
                },
            }),
            DEFAULT_TIMEOUT_MS,
            'search'
        );
        const html = await res.text();

        const results = [];
        const re =
            /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = re.exec(html)) && results.length < limit) {
            let href = match[1];
            const title = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            const uddg = href.match(/[?&]uddg=([^&]+)/);
            if (uddg) {
                try {
                    href = decodeURIComponent(uddg[1]);
                } catch {
                }
            }
            if (!title || !href) continue;
            results.push({ title, url: href });
        }

        let abstract = null;
        try {
            const iaRes = await withTimeout(
                fetch(
                    `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
                    { headers: { 'User-Agent': 'DeployHub-AgentSearch/1.0' } }
                ),
                5000,
                'ddg-ia'
            );
            const ia = await iaRes.json();
            if (ia?.AbstractText) {
                abstract = {
                    text: String(ia.AbstractText).slice(0, 600),
                    source: ia.AbstractSource || null,
                    url: ia.AbstractURL || null,
                };
            }
        } catch {
        }

        return {
            ok: true,
            query: q,
            abstract,
            results,
            hint: 'Use these links/snippets to suggest fixes; verify against the user\'s actual logs.',
        };
    } catch (error) {
        return { ok: false, query: q, message: error.message };
    }
}


export async function lookupNpmPackage(name, { version } = {}) {
    const pkg = String(name || '').trim().replace(/^\/+|\/+$/g, '');
    if (!pkg) return { ok: false, message: 'package name is required' };
    if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i.test(pkg)) {
        return { ok: false, message: 'invalid npm package name' };
    }

    const path = version
        ? `/${encodeURIComponent(pkg).replace('%2F', '/')}/${encodeURIComponent(version)}`
        : `/${encodeURIComponent(pkg).replace('%2F', '/')}`;

    try {
        const res = await withTimeout(
            fetch(`https://registry.npmjs.org${path}`, {
                headers: { Accept: 'application/json', 'User-Agent': 'DeployHub-Agent/1.0' },
            }),
            DEFAULT_TIMEOUT_MS,
            'npm'
        );
        if (res.status === 404) return { ok: false, message: `Package not found: ${pkg}` };
        if (!res.ok) return { ok: false, message: `npm registry ${res.status}` };
        const data = await res.json();

        if (version || data.version) {
            return {
                ok: true,
                registry: 'npm',
                name: data.name || pkg,
                version: data.version,
                description: data.description || null,
                license: data.license || null,
                homepage: data.homepage || null,
                repository: data.repository?.url || data.repository || null,
                deprecated: data.deprecated || null,
                dependencies: data.dependencies ? Object.keys(data.dependencies).slice(0, 30) : [],
            };
        }

        const latest = data['dist-tags']?.latest;
        const latestMeta = latest ? data.versions?.[latest] : null;
        return {
            ok: true,
            registry: 'npm',
            name: data.name || pkg,
            description: data.description || null,
            latest,
            license: latestMeta?.license || data.license || null,
            homepage: data.homepage || null,
            repository: data.repository?.url || data.repository || null,
            deprecated: latestMeta?.deprecated || null,
            versionsSample: Object.keys(data.versions || {}).slice(-8),
            modified: data.time?.modified || null,
        };
    } catch (error) {
        return { ok: false, message: error.message };
    }
}


export async function lookupPypiPackage(name) {
    const pkg = String(name || '').trim();
    if (!pkg) return { ok: false, message: 'package name is required' };
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(pkg)) {
        return { ok: false, message: 'invalid PyPI package name' };
    }

    try {
        const res = await withTimeout(
            fetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, {
                headers: { Accept: 'application/json', 'User-Agent': 'DeployHub-Agent/1.0' },
            }),
            DEFAULT_TIMEOUT_MS,
            'pypi'
        );
        if (res.status === 404) return { ok: false, message: `Package not found: ${pkg}` };
        if (!res.ok) return { ok: false, message: `PyPI ${res.status}` };
        const data = await res.json();
        const info = data.info || {};
        return {
            ok: true,
            registry: 'pypi',
            name: info.name || pkg,
            version: info.version,
            summary: info.summary || null,
            homePage: info.home_page || info.project_url || null,
            requiresPython: info.requires_python || null,
            license: info.license || null,
            yanked: Boolean(info.yanked),
        };
    } catch (error) {
        return { ok: false, message: error.message };
    }
}


export async function lookupDomainWhois(domainOrUrl) {
    const hostname = normalizeHostname(domainOrUrl);
    if (!hostname) return { ok: false, message: 'domain is required' };
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length < 2) return { ok: false, message: 'need a full domain like example.com' };
    const domain = parts.slice(-2).join('.');
    await assertPublicHostname(domain);

    try {
        const res = await withTimeout(
            fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
                headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': 'DeployHub-Agent/1.0' },
            }),
            10000,
            'rdap'
        );
        if (res.status === 404) {
            return { ok: false, domain, message: 'Domain not found in RDAP' };
        }
        if (!res.ok) {
            return { ok: false, domain, message: `RDAP ${res.status}` };
        }
        const data = await res.json();
        const events = Array.isArray(data.events) ? data.events : [];
        const findEvent = (action) =>
            events.find((e) => String(e.eventAction || '').toLowerCase() === action)?.eventDate ||
            null;

        const expires = findEvent('expiration');
        let daysRemaining = null;
        if (expires) {
            const t = new Date(expires).getTime();
            if (!Number.isNaN(t)) {
                daysRemaining = Math.floor((t - Date.now()) / (24 * 60 * 60 * 1000));
            }
        }

        const nameservers = (data.nameservers || [])
            .map((ns) => ns.ldhName || ns.unicodeName)
            .filter(Boolean);

        const statuses = (data.status || []).map(String);

        return {
            ok: true,
            domain: data.ldhName || domain,
            handle: data.handle || null,
            status: statuses.slice(0, 10),
            registered: findEvent('registration'),
            lastChanged: findEvent('last changed'),
            expires,
            daysRemaining,
            nameservers: nameservers.slice(0, 10),
            rdapConformance: data.rdapConformance || null,
        };
    } catch (error) {
        return { ok: false, domain, message: error.message };
    }
}


export async function fetchPublicPage(url, { maxChars = MAX_BODY_CHARS } = {}) {
    const parsed = assertSafePublicUrl(url);
    await assertPublicHostname(parsed.hostname);

    try {
        const res = await withTimeout(
            fetch(parsed.toString(), {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'DeployHub-AgentFetch/1.0',
                    Accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.8',
                },
            }),
            DEFAULT_TIMEOUT_MS,
            'fetch'
        );
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        const clipped = text.slice(0, Math.min(Number(maxChars) || MAX_BODY_CHARS, 8000));
        return {
            ok: res.ok,
            url: parsed.toString(),
            finalUrl: res.url,
            status: res.status,
            contentType,
            bodySnippet: clipped,
        };
    } catch (error) {
        return { ok: false, url: String(url), message: error.message };
    }
}


export async function getGithubRepoInsights(accessToken, repoFullName, { branch } = {}) {
    const repo = String(repoFullName || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        return { ok: false, message: 'repo must look like owner/name' };
    }
    if (!accessToken) {
        return { ok: false, message: 'GitHub not linked for this user' };
    }

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DeployHub-Agent/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    const gh = async (path) => {
        const res = await withTimeout(
            fetch(`https://api.github.com${path}`, { headers }),
            DEFAULT_TIMEOUT_MS,
            'github'
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.message || `GitHub ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return data;
    };

    try {
        const repoInfo = await gh(`/repos/${repo}`);
        const defaultBranch = branch || repoInfo.default_branch || 'main';

        const [commits, pulls, workflows] = await Promise.all([
            gh(`/repos/${repo}/commits?sha=${encodeURIComponent(defaultBranch)}&per_page=3`),
            gh(`/repos/${repo}/pulls?state=open&per_page=5`),
            gh(`/repos/${repo}/actions/runs?per_page=5`).catch(() => ({ workflow_runs: [] })),
        ]);

        return {
            ok: true,
            repo,
            defaultBranch,
            private: repoInfo.private,
            htmlUrl: repoInfo.html_url,
            pushedAt: repoInfo.pushed_at,
            latestCommits: (Array.isArray(commits) ? commits : []).slice(0, 3).map((c) => ({
                sha: c.sha?.slice(0, 7),
                message: c.commit?.message?.split('\n')[0],
                author: c.commit?.author?.name || c.author?.login,
                date: c.commit?.author?.date,
                url: c.html_url,
            })),
            openPullRequests: (Array.isArray(pulls) ? pulls : []).map((p) => ({
                number: p.number,
                title: p.title,
                user: p.user?.login,
                createdAt: p.created_at,
                url: p.html_url,
            })),
            recentWorkflowRuns: (workflows.workflow_runs || []).slice(0, 5).map((r) => ({
                name: r.name,
                status: r.status,
                conclusion: r.conclusion,
                event: r.event,
                branch: r.head_branch,
                createdAt: r.created_at,
                url: r.html_url,
            })),
        };
    } catch (error) {
        return {
            ok: false,
            repo,
            status: error.status,
            message: error.message,
        };
    }
}
