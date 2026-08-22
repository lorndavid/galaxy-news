import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const profileUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
      avatar: z.string().url("Avatar must be a valid URL").nullable().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
    })
    .refine((v) => !v.newPassword || v.currentPassword, {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    }),
});
