export type Role = "USER" | "EDITOR" | "ADMIN";

const RANK: Record<Role, number> = {
  USER: 0,
  EDITOR: 1,
  ADMIN: 2,
};

export function isRole(value: string): value is Role {
  return value === "USER" || value === "EDITOR" || value === "ADMIN";
}

/** True when `role` meets or exceeds the `required` role. */
export function hasRole(role: string, required: Role): boolean {
  const r = isRole(role) ? role : "USER";
  return RANK[r] >= RANK[required];
}

/** True when a user with `role` may view content gated at `accessRole`. */
export function canAccess(role: string, accessRole: string): boolean {
  const required = isRole(accessRole) ? accessRole : "USER";
  return hasRole(role, required);
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Member",
  EDITOR: "Editor",
  ADMIN: "Admin",
};
