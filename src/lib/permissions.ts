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

/** Can manage shared content (courses, modules, lessons, skills, prompts, agents) and tags. */
export function canEditContent(role: string): boolean {
  return hasRole(role, "EDITOR");
}

/** Can manage users and view everyone's notes. */
export function canManageUsers(role: string): boolean {
  return hasRole(role, "ADMIN");
}

/**
 * What each role can do. Members manage only their own personal data;
 * Editors also manage shared content & tags; Admins also manage users.
 */
export const ROLE_CAPABILITIES: Record<Role, string[]> = {
  USER: [
    "Browse all content they have access to",
    "Favorite any page; keep private notes",
    "Save & edit their own copy of any prompt or skill",
    "Manage their URL library links and link tags",
    "Edit their own profile, theme, and default landing page",
  ],
  EDITOR: [
    "Everything a Member can do",
    "Create, edit & delete courses, modules & lessons",
    "Create, edit & delete skills, prompts & agents",
    "Create tags and assign them to any content",
  ],
  ADMIN: [
    "Everything an Editor can do",
    "Manage users and change their roles",
    "Review all members' notes",
  ],
};
