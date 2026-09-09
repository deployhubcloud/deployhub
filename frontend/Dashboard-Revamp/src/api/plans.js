// The project service owns prices, capabilities, and resource allocations.
export function normalizePlans(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return Object.fromEntries(
    Object.entries(data)
      .filter(
        ([, plan]) =>
          plan &&
          Number.isFinite(plan.price) &&
          plan.price >= 0 &&
          Array.isArray(plan.deployment_Type),
      )
      .map(([id, plan]) => [
        id,
        {
          ...plan,
          name: String(plan.name || id).replace(/^./, (letter) => letter.toUpperCase()),
          types: plan.deployment_Type,
          features: [
            plan.subdomain && 'DeployHub subdomain',
            plan.customDomain && 'Custom domains',
            plan.ssl && 'SSL included',
            plan.github_Ci_Cd && 'GitHub CI/CD',
            plan.ai_dignostics && 'AI diagnostics',
            plan.uptime_monitoring && 'Uptime monitoring',
            ...Object.entries(plan.alerts || {})
              .filter(([, enabled]) => enabled)
              .map(([channel]) => `${channel} alerts`),
          ].filter(Boolean),
          resources: plan.resources
            ? {
                ram: plan.resources.ram,
                cpu: `${plan.resources.cpu} vCPU`,
                storage: Number.isFinite(Number(plan.resources.storage))
                  ? `${Number(plan.resources.storage) / 1024} GB`
                  : plan.resources.storage,
              }
            : null,
        },
      ]),
  )
}
