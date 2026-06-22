export function getRequestHost(rawHost) {
  if (!rawHost) return null;

  const host = String(rawHost).trim().toLowerCase();
  if (!host) return null;

  if (host.startsWith("[")) {
    const closingBracket = host.indexOf("]");
    return closingBracket > 0 ? host.slice(1, closingBracket) : null;
  }

  return host.split(":")[0] || null;
}

export function getSubdomain(domain, rootDomain) {
  const suffix = `.${rootDomain.toLowerCase()}`;
  if (!domain.endsWith(suffix)) return null;

  const subdomain = domain.slice(0, -suffix.length);
  return subdomain || null;
}
