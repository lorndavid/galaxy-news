import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "../constants";
import { env } from "../config/env";

export interface TokenPayload {
  sub: number;
  role: Role;
}

export function signAccessToken(user: { id: number; role: Role }): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.accessTtl,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwt.secret) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), role: decoded.role as Role };
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
}
