import { Request, Response } from "express";
import { env } from "../config/env";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { noContent, ok } from "../utils/respond";

export const REFRESH_COOKIE = "navatra_refresh";

function refreshCookieOptions() {
  // In production with Vercel frontend on different subdomain:
  // www.galaxytv4k.online → api.galaxytv4k.online requires sameSite: "none"
  // This is safe because: secure: true enforces HTTPS, httpOnly prevents XSS
  const isCrossSubdomain = env.isProd && env.cors.frontendOrigin?.includes("https://");
  return {
    httpOnly: true,
    sameSite: isCrossSubdomain ? ("none" as const) : ("lax" as const),
    secure: env.isProd,
    path: "/api/v1/auth",
    maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { email: string; password: string; rememberMe?: boolean } };
  const result = await authService.login(body, req.ip);
  const ttlDays = body.rememberMe ? 7 : env.jwt.refreshTtlDays;
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...refreshCookieOptions(),
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
  });
  ok(res, { user: result.user, accessToken: result.accessToken }, "Logged in successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshTokens(req.cookies?.[REFRESH_COOKIE], req.ip);
  // Use remaining lifetime for the cookie so sessions with "Remember me"
  // keep their 7-day window across rotations.
  const remainingMs = result.expiresAt.getTime() - Date.now();
  const ttlMs = remainingMs > 0 ? remainingMs : env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...refreshCookieOptions(),
    maxAge: ttlMs,
  });
  ok(res, { user: result.user, accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  noContent(res);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  ok(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as {
    body: {
      name?: string;
      avatar?: string | null;
      currentPassword?: string;
      newPassword?: string;
    };
  };
  const user = await authService.updateProfile(req.user!.id, body, req.ip);
  ok(res, user, "Profile updated");
});
