import { Request, Response } from "express";
import * as settingsService from "../services/settings.service";
import * as categoryService from "../services/category.service";
import * as tagService from "../services/tag.service";
import * as adService from "../services/ad.service";
import * as commentService from "../services/comment.service";
import * as contactService from "../services/contact.service";
import * as newsletterService from "../services/newsletter.service";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { created, ok } from "../utils/respond";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await settingsService.getPublic());
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await categoryService.listPublic());
});

export const getTags = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await tagService.listAll());
});

export const getAds = asyncHandler(async (req: Request, res: Response) => {
  const device = adService.deviceFromUserAgent(req.get("user-agent") ?? "");
  ok(res, await adService.getByPosition(req.params.position, device));
});

export const submitComment = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as {
    body: { articleId: number; name: string; email: string; content: string };
  };
  const comment = await commentService.submitComment(body, req.ip);
  created(res, comment, "Comment submitted and awaiting moderation");
});

export const getArticleComments = asyncHandler(async (req: Request, res: Response) => {
  const articleId = Number(req.query.articleId ?? req.params.articleId);
  if (!Number.isInteger(articleId) || articleId <= 0) {
    throw new ApiError(400, "A valid articleId query parameter is required");
  }
  ok(res, await commentService.listApprovedByArticle(articleId));
});

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as {
    body: { name: string; email: string; subject?: string; message: string };
  };
  const message = await contactService.submitMessage(body);
  created(res, { id: message.id }, "Message sent successfully");
});

export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: { email: string } };
  const sub = await newsletterService.subscribe(body);
  created(res, { id: sub.id }, "Subscription successful");
});

export const getSitemap = asyncHandler(async (req: Request, res: Response) => {
  const base = `${req.protocol}://${req.get("host")}`;
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  const urls = [
    `<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...categories.map(
      (c) => `<url><loc>${base}/category/${c.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ),
    ...articles.map(
      (a) =>
        `<url><loc>${base}/article/${a.slug}</loc><lastmod>${a.updatedAt.toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`
    ),
  ];

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join(
      ""
    )}</urlset>`
  );
});

export const getRobots = asyncHandler(async (_req: Request, res: Response) => {
  res.type("text/plain").send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /api/",
      "",
      "Sitemap: /sitemap.xml",
      "",
    ].join("\n")
  );
});
