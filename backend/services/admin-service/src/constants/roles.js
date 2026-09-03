export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    NORMAL_ADMIN: 'normal_admin',
};

export const PERMISSIONS = {
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
    PROJECTS_READ: 'projects:read',
    PROJECTS_WRITE: 'projects:write',
    DASHBOARD_READ: 'dashboard:read',
    ADMINS_MANAGE: 'admins:manage',
    AUDIT_READ: 'audit:read',
    SYSTEM_MANAGE: 'system:manage',
};

const SUPER_PERMISSIONS = new Set(Object.values(PERMISSIONS));

const NORMAL_PERMISSIONS = new Set([
    PERMISSIONS.USERS_READ,
]);

export function normalizeRole(role) {
    if (role === 'admin') return ROLES.SUPER_ADMIN;
    return role;
}

export function permissionsForRole(role) {
    const r = normalizeRole(role);
    if (r === ROLES.SUPER_ADMIN) return [...SUPER_PERMISSIONS];
    if (r === ROLES.NORMAL_ADMIN) return [...NORMAL_PERMISSIONS];
    return [];
}

export function roleHasPermission(role, permission) {
    const r = normalizeRole(role);
    if (r === ROLES.SUPER_ADMIN) return SUPER_PERMISSIONS.has(permission);
    if (r === ROLES.NORMAL_ADMIN) return NORMAL_PERMISSIONS.has(permission);
    return false;
}
