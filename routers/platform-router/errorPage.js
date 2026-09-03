const DISCORD_URL = 'https://discord.gg/Jx4wDnKT9';

const COPY = {
  400: {
    kicker: 'Bad request',
    title: 'Invalid host',
    message: 'This request did not include a valid hostname, so DeployHub cannot route it.',
  },
  404: {
    kicker: 'Not found',
    title: 'Domain not configured',
    message: 'This hostname is not mapped on the platform. Check the URL, DNS, or wait a moment if you just added the domain.',
  },
  500: {
    kicker: 'Server error',
    title: 'Something went wrong',
    message: 'The platform router hit an unexpected error while handling this request.',
  },
  502: {
    kicker: 'Temporarily down',
    title: 'Service unavailable',
    message: 'The site is configured, but the upstream service is not responding right now. This is usually a restart or a brief outage.',
  },
};

export function sendErrorPage(res, status = 502, overrides = {}) {
  const preset = COPY[status] || COPY[500];
  const kicker = overrides.kicker || preset.kicker;
  const title = overrides.title || preset.title;
  const message = overrides.message || preset.message;
  const html = renderErrorPage({ status, kicker, title, message });

  if (!res || res.headersSent) return;
  res.statusCode = status;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
  }
  res.end(html);
}

function renderErrorPage({ status, kicker, title, message }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(status)} · ${escapeHtml(title)} · DeployHub</title>
  <style>
    :root {
      --bg: #0b0f0e;
      --panel: #151b18;
      --line: #2a342e;
      --text: #edf3ef;
      --muted: #8f9f95;
      --accent: #2f9e6c;
      --accent-soft: rgba(47, 158, 108, 0.16);
      --discord: #5865f2;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; }
    body {
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(900px 420px at 8% -10%, rgba(47, 158, 108, 0.16), transparent 55%),
        radial-gradient(700px 380px at 100% 0%, rgba(88, 101, 242, 0.12), transparent 50%),
        linear-gradient(180deg, #0d1210 0%, var(--bg) 42%, #090c0b 100%);
      display: grid;
      place-items: center;
      padding: 32px 18px;
    }
    .card {
      width: min(560px, 100%);
      background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 42%), var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: 0 30px 80px rgba(0,0,0,.4);
      padding: 36px 32px 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: .22em;
      text-transform: uppercase;
      margin-bottom: 28px;
    }
    .mark {
      width: 34px; height: 34px; border-radius: 10px;
      background: var(--accent-soft);
      border: 1px solid rgba(47,158,108,.35);
      display: grid; place-items: center;
      color: #7ddeb0; font-weight: 700;
    }
    .code {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: #7ddeb0;
      background: var(--accent-soft);
      border: 1px solid rgba(47,158,108,.25);
      border-radius: 999px;
      padding: 5px 10px;
    }
    h1 {
      margin: 16px 0 10px;
      font-size: clamp(28px, 5vw, 38px);
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    p { margin: 0; color: var(--muted); line-height: 1.6; font-size: 15px; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      border-radius: 12px;
      padding: 11px 16px;
      font-weight: 600;
      font-size: 14px;
    }
    .discord {
      background: var(--discord);
      color: #fff;
    }
    .discord:hover { filter: brightness(1.08); }
    .home {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--line);
    }
    .home:hover { background: rgba(255,255,255,.03); }
    .foot {
      margin-top: 26px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand"><span class="mark">D</span> DeployHub</div>
    <div class="code">${escapeHtml(String(status))} · ${escapeHtml(kicker)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p style="margin-top:14px">If you want help, updates, or just want to ask what is going on — join the DeployHub Discord.</p>
    <div class="actions">
      <a class="discord" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join Discord</a>
      <a class="home" href="https://deployhub.cloud">Go to deployhub.cloud</a>
    </div>
    <div class="foot">This page is served by the DeployHub platform router.</div>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
