import bcrypt from "bcryptjs";
import { Role } from "../constants";
import { prisma } from "../lib/prisma";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../lib/auth";
import { ApiError } from "../utils/ApiError";
import { safeUserSelect } from "../utils/serialize";
import { logActivity } from "./activity.service";

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput, ip?: string | null) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  await logActivity({
    userId: user.id,
    action: "USER_LOGGED_IN",
    ip,
  });

  const { passwordHash: _pw, ...safe } = user;
  return {
    user: safe,
    accessToken: signAccessToken({ id: user.id, role: user.role as Role }),
    refreshToken,
  };
}

export async function refreshTokens(refreshToken: string | undefined, ip?: string | null) {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing");
  }
  const hashed = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashed },
    include: { user: { select: safeUserSelect } },
  });
  if (!stored) {
    throw ApiError.unauthorized("Invalid refresh token");
  }
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw ApiError.unauthorized("Refresh token expired");
  }

  // Rotate the refresh token (reuse detection friendly).
  const nextToken = generateRefreshToken();
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: {
        token: hashRefreshToken(nextToken),
        userId: stored.userId,
        expiresAt: refreshTokenExpiry(),
      },
    }),
  ]);

  await logActivity({ userId: stored.userId, action: "TOKEN_REFRESHED", ip });

  return {
    user: stored.user,
    accessToken: signAccessToken({ id: stored.user.id, role: stored.user.role as Role }),
    refreshToken: nextToken,
  };
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    const hashed = hashRefreshToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { token: hashed } });
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateProfile(
  userId: number,
  data: { name?: string; avatar?: string | null; currentPassword?: string; newPassword?: string },
  ip?: string | null
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const update: { name?: string; avatar?: string | null; passwordHash?: string } = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.avatar !== undefined) update.avatar = data.avatar;

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw ApiError.badRequest("Current password is required to set a new password");
    }
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw ApiError.badRequest("Current password is incorrect");
    }
    update.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: update,
    select: safeUserSelect,
  });

  await logActivity({ userId, action: "PROFILE_UPDATED", ip });
  return updated;
}
