"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasRole, isRole } from "@/lib/permissions";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "ADMIN")) {
    throw new Error("Admin access required");
  }
  return user;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "EDITOR")) {
    throw new Error("Editor access required");
  }
  return user;
}

export async function setUserRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!isRole(role)) throw new Error("Invalid role");
  // Prevent an admin from accidentally demoting themselves and locking everyone out.
  if (userId === admin.id && role !== "ADMIN") {
    return { error: "You cannot change your own admin role." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUser(
  userId: string,
  data: { name?: string; role?: string },
): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireAdmin();
  const patch: { name?: string; role?: string } = {};
  if (typeof data.name === "string" && data.name.trim()) {
    patch.name = data.name.trim();
  }
  if (typeof data.role === "string") {
    if (!isRole(data.role)) return { error: "Invalid role" };
    if (userId === admin.id && data.role !== "ADMIN") {
      return { error: "You cannot change your own admin role." };
    }
    patch.role = data.role;
  }
  await prisma.user.update({ where: { id: userId }, data: patch });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setAccessMode(userId: string, mode: string) {
  await requireAdmin();
  if (mode !== "all" && mode !== "custom") return { error: "Invalid mode" };
  await prisma.user.update({ where: { id: userId }, data: { accessMode: mode } });
  revalidatePath(`/admin/users/${userId}/access`);
  return { ok: true };
}

export async function setUserSection(
  userId: string,
  section: string,
  enabled: boolean,
) {
  await requireAdmin();
  if (enabled) {
    await prisma.userSection.upsert({
      where: { userId_section: { userId, section } },
      update: {},
      create: { userId, section },
    });
  } else {
    await prisma.userSection.deleteMany({ where: { userId, section } });
  }
  revalidatePath(`/admin/users/${userId}/access`);
}

export async function setGrant(
  userId: string,
  resourceType: string,
  resourceId: string,
  granted: boolean,
) {
  await requireAdmin();
  if (granted) {
    await prisma.accessGrant.upsert({
      where: { userId_resourceType_resourceId: { userId, resourceType, resourceId } },
      update: {},
      create: { userId, resourceType, resourceId },
    });
  } else {
    await prisma.accessGrant.deleteMany({ where: { userId, resourceType, resourceId } });
  }
  revalidatePath(`/admin/users/${userId}/access`);
}

/** Grant/revoke every lesson under a module (bulk) for a user. */
export async function setModuleLessons(
  userId: string,
  moduleId: string,
  granted: boolean,
) {
  await requireAdmin();
  const lessons = await prisma.lesson.findMany({ where: { moduleId }, select: { id: true } });
  const ids = lessons.map((l) => l.id);
  if (granted) {
    await prisma.accessGrant.deleteMany({
      where: { userId, resourceType: "lesson", resourceId: { in: ids } },
    });
    await prisma.accessGrant.createMany({
      data: ids.map((id) => ({ userId, resourceType: "lesson", resourceId: id })),
    });
  } else {
    await prisma.accessGrant.deleteMany({
      where: { userId, resourceType: "lesson", resourceId: { in: ids } },
    });
  }
  revalidatePath(`/admin/users/${userId}/access`);
}

export async function createTag(name: string, color: string) {
  await requireEditor();
  const clean = name.trim();
  if (!clean) return { error: "Tag name is required." };
  const existing = await prisma.tag.findUnique({ where: { name: clean } });
  if (existing) return { error: "That tag already exists." };
  await prisma.tag.create({ data: { name: clean, color } });
  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function deleteTag(id: string) {
  await requireEditor();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
}

export async function assignTag(
  tagId: string,
  entityType: string,
  entityId: string,
) {
  await requireEditor();
  await prisma.tagAssignment.upsert({
    where: {
      tagId_entityType_entityId: { tagId, entityType, entityId },
    },
    update: {},
    create: { tagId, entityType, entityId },
  });
  revalidatePath("/admin/tags");
}

export async function unassignTag(
  tagId: string,
  entityType: string,
  entityId: string,
) {
  await requireEditor();
  await prisma.tagAssignment.deleteMany({
    where: { tagId, entityType, entityId },
  });
  revalidatePath("/admin/tags");
}
