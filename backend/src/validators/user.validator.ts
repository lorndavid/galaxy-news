import { z } from "zod";

export const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"]);

export const userCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
    avatar: z.string().url().nullable().optional(),
  }),
});

export const userUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.string().trim().email().optional(),
      password: z.string().min(6).optional(),
      role: roleEnum.optional(),
      isActive: z.boolean().optional(),
      avatar: z.string().url().nullable().optional(),
    })
    .partial(),
});

export const userListQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    q: z.string().trim().optional(),
    role: roleEnum.optional(),
  }),
});
