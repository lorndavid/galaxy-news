import { NextFunction, Request, Response } from "express";
import { Role } from "../constants";
import { verifyAccessToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized();
    }
    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("Account is deactivated");
    }
    req.user = { ...user, role: user.role as Role };
    next();
  }
);

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole(Role.SUPER_ADMIN, Role.ADMIN);
export const requireEditor = requireRole(
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.EDITOR
);
export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);
