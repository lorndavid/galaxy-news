import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { loginSchema, profileUpdateSchema } from "../validators/auth.validator";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.patch("/me", authenticate, validate(profileUpdateSchema), authController.updateProfile);
