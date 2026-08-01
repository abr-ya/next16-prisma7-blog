export const AUTH_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export const DEFAULT_AUTH_ROLE = AUTH_ROLES.USER;

export const parseAuthRoles = (role: string | null | undefined) => {
  return (role ?? DEFAULT_AUTH_ROLE)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const hasAuthRole = (role: string | null | undefined, requiredRole: AuthRole) => {
  return parseAuthRoles(role).includes(requiredRole);
};

export const hasAdminRole = (role: string | null | undefined) => {
  return hasAuthRole(role, AUTH_ROLES.ADMIN);
};
