import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.validated as {
    query: { page?: number; pageSize?: number; q?: string; role?: string };
  };
  ok(
    res,
    await userService.listUsers(
      String(query.page ?? ""),
      String(query.pageSize ?? ""),
      query.q,
      query.role
    )
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: userService.UserInput };
  created(res, await userService.createUser(body, req.user!.id, req.user!.role, req.ip), "User created");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: userService.UserInput };
  ok(res, await userService.updateUser(Number(req.params.id), body, req.user!.id, req.user!.role, req.ip), "User updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});
