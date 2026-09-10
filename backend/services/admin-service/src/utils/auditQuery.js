function invalid(message) { const error = new Error(message); error.status = 400; throw error; }
function pageNumber(value, fallback, maximum) {
  const parsed = Number(value);
  if (value !== undefined && value !== '' && (!Number.isFinite(parsed) || parsed < 1 || !Number.isInteger(parsed))) invalid('Pagination values must be positive integers');
  return Math.min(maximum, parsed || fallback);
}
export function buildAuditQuery(params = {}) {
  const page = pageNumber(params.page, 1, 1000000);
  const limit = pageNumber(params.limit, 25, 100);
  const filter = {};
  if (params.actor) filter.actorUsername = String(params.actor).trim().toLowerCase().slice(0, 200);
  if (params.action) filter.action = { $regex: String(params.action).trim().slice(0, 200).replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (params.outcome) {
    if (!['success', 'failed'].includes(params.outcome)) invalid('Invalid audit outcome');
    filter.statusCode = params.outcome === 'failed' ? { $gte: 400 } : { $gte: 200, $lt: 400 };
  }
  if (params.from || params.to) {
    filter.createdAt = {};
    for (const [key, operator] of [['from', '$gte'], ['to', '$lte']]) {
      if (!params[key]) continue;
      const value = String(params[key]);
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) invalid('Invalid date range');
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        if (date.toISOString().slice(0, 10) !== value) invalid('Invalid date range');
        if (key === 'to') date.setUTCHours(23, 59, 59, 999);
      }
      filter.createdAt[operator] = date;
    }
    if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) invalid('From date must precede the to date');
  }
  return { filter, page, limit };
}
