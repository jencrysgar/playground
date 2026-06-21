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
