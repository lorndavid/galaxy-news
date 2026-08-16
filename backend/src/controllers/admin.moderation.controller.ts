import { Request, Response } from "express";
import { CommentStatus } from "../constants";
import * as commentService from "../services/comment.service";
import * as contactService from "../services/contact.service";
import * as newsletterService from "../services/newsletter.service";
import { asyncHandler } from "../utils/asyncHandler";
import { noContent, ok } from "../utils/respond";

// ---------- Comments ----------

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.validated as {
    query: { page?: number; pageSize?: number; status?: CommentStatus; articleId?: number };
  };
  ok(
    res,
    await commentService.listAdmin(
      String(query.page ?? ""),
      String(query.pageSize ?? ""),
      query.status,
      query.articleId !== undefined ? String(query.articleId) : undefined
    )
  );
});

export const moderateComment = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { status: CommentStatus } };
  ok(res, await commentService.setCommentStatus(Number(req.params.id), body.status, req.user!.id, req.ip), "Comment updated");
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentService.deleteComment(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});

// ---------- Contact messages ----------

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as Record<string, unknown>;
  ok(res, await contactService.listMessages(q.page, q.pageSize));
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  await contactService.deleteMessage(Number(req.params.id));
  noContent(res);
});

// ---------- Newsletter subscribers ----------

export const listSubscribers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.validated as {
    query: { page?: number; pageSize?: number };
  };
  ok(res, await newsletterService.listSubscribers(String(query.page ?? ""), String(query.pageSize ?? "")));
});

export const deleteSubscriber = asyncHandler(async (req: Request, res: Response) => {
  await newsletterService.deleteSubscriber(Number(req.params.id));
  noContent(res);
});
