import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Public read API: each page load fires ~10 small cached requests and many
  // readers share one IP behind carrier NAT, so the window must be generous.
  // Real abuse protection lives on auth (15/15m) and admin mutations.
  limit: 3000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    code: "RATE_LIMITED",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
    code: "RATE_LIMITED",
  },
});
