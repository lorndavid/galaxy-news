import bcrypt from "bcryptjs";
import { Role } from "../constants";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildPagination, parsePagination } from "../utils/paginate";
import { safeUserSelect } from "../utils/serialize";
import { logActivity } from "./activity.service";

export async function listUsers(pageRaw?: string | string[], pageSizeRaw?: string | string[], q?: string, role?: string) {
  const pagination = parsePagination(pageRaw, pageSizeRaw, 50);
  const where: Record<string, unknown> = {};
  if (q?.trim()) {
    where.OR = [{ name: { contains: q.trim() } }, { email: { contains: q.trim() } }];
  }
  if (role) where.role = role;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ]);
  return buildPagination(items, total, pagination);
}

export interface UserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  avatar?: string | null;
}

export async function createUser(input: UserInput, actorId: number, actorRole: Role, ip?: string | null) {
  if (!input.name?.trim() || !input.email?.trim() || !input.password) {
    throw ApiError.badRequest("Name, email and password are required");
  }
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const role = input.role ?? Role.AUTHOR;
  if (actorRole !== Role.SUPER_ADMIN && role === Role.SUPER_ADMIN) {
    throw ApiError.forbidden("Only a SUPER_ADMIN can create another SUPER_ADMIN");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 10),
      role,
      isActive: input.isActive ?? true,
      avatar: input.avatar ?? null,
    },
    select: safeUserSelect,
  });
  await logActivity({ userId: actorId, action: "USER_CREATED", entity: "User", entityId: user.id, meta: { email }, ip });
  return user;
}

export async function updateUser(id: number, input: UserInput, actorId: number, actorRole: Role, ip?: string | null) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound("User not found");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== id) throw ApiError.conflict("A user with this email already exists");
    data.email = email;
  }
  if (input.avatar !== undefined) data.avatar = input.avatar || null;
  if (input.isActive !== undefined) {
    if (id === actorId && input.isActive === false) {
      throw ApiError.badRequest("You cannot deactivate your own account");
    }
    if (target.role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw ApiError.forbidden("Only a SUPER_ADMIN can change a SUPER_ADMIN account");
    }
    data.isActive = input.isActive;
  }
  if (input.role !== undefined && input.role !== target.role) {
    if (actorRole !== Role.SUPER_ADMIN) {
      throw ApiError.forbidden("Only a SUPER_ADMIN can change roles");
    }
    if (id === actorId && target.role === Role.SUPER_ADMIN) {
      throw ApiError.badRequest("You cannot change your own role");
    }
    data.role = input.role;
  }
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data, select: safeUserSelect });
  await logActivity({ userId: actorId, action: "USER_UPDATED", entity: "User", entityId: id, meta: { email: user.email }, ip });
  return user;
}

export async function deleteUser(id: number, actorId: number, ip?: string | null) {
  if (id === actorId) throw ApiError.badRequest("You cannot delete your own account");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound("User not found");
  if (target.role === Role.SUPER_ADMIN) {
    throw ApiError.forbidden("SUPER_ADMIN accounts cannot be deleted");
  }
  await prisma.user.delete({ where: { id } });
  await logActivity({ userId: actorId, action: "USER_DELETED", entity: "User", entityId: id, meta: { email: target.email }, ip });
}
