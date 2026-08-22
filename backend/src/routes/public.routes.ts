import { Router } from "express";
import * as articleController from "../controllers/article.controller";
import * as publicController from "../controllers/public.controller";
import * as builderService from "../services/homepage.service";
import * as navigationService from "../services/navigation.service";
import * as tickerService from "../services/ticker.service";
import * as liveStreamService from "../services/livestream.service";
import { ttlCache } from "../middleware/cache";
import { ok } from "../utils/respond";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { publicArticleListQuery } from "../validators/article.validator";
import { commentCreateSchema, contactCreateSchema, newsletterCreateSchema } from "../validators/content.validator";

export const publicRouter = Router();

// Public GET feeds are cached briefly to absorb burst traffic;
// POST endpoints (comments/contact) always hit the database.
const publicCache = ttlCache(30_000);

// Site meta
publicRouter.get("/settings", publicCache, publicController.getSettings);
publicRouter.get("/categories", publicCache, publicController.getCategories);
publicRouter.get("/tags", publicCache, publicController.getTags);
publicRouter.get("/homepage/sections", publicCache, asyncHandler(async (_req, res) => ok(res, await builderService.getPublicSections())));
publicRouter.get("/navigation", publicCache, asyncHandler(async (_req, res) => ok(res, await navigationService.getPublicNav())));
// Live news ticker (settings + real published articles, cached)
publicRouter.get("/ticker", publicCache, asyncHandler(async (_req, res) => ok(res, await tickerService.getTickerData())));
// Facebook Live Streams
publicRouter.get("/live-streams", publicCache, asyncHandler(async (_req, res) => ok(res, await liveStreamService.getPublicStreams())));
publicRouter.get("/live-streams/active", publicCache, asyncHandler(async (_req, res) => ok(res, await liveStreamService.getActiveStream())));
publicRouter.get("/live-streams/homepage", publicCache, asyncHandler(async (_req, res) => ok(res, await liveStreamService.getHomepageStream())));
publicRouter.get("/ads/:position", publicCache, publicController.getAds);
publicRouter.get("/sitemap.xml", publicCache, publicController.getSitemap);
publicRouter.get("/robots.txt", publicCache, publicController.getRobots);

// Articles (specific routes must precede /articles/:slug)
publicRouter.get("/articles", publicCache, validate(publicArticleListQuery), articleController.list);
publicRouter.get("/articles/breaking", publicCache, articleController.breaking);
publicRouter.get("/articles/featured", publicCache, articleController.featured);
publicRouter.get("/articles/latest", publicCache, articleController.latest);
publicRouter.get("/articles/popular", publicCache, articleController.popular);
publicRouter.get("/articles/:slug", publicCache, articleController.getBySlug);
publicRouter.get("/articles/:slug/related", publicCache, articleController.getRelated);

// Category & author listings
publicRouter.get("/categories/:slug/articles", publicCache, articleController.byCategory);
publicRouter.get("/authors/:id/articles", publicCache, articleController.byAuthor);

// Comments & contact
publicRouter.get("/comments", publicCache, publicController.getArticleComments);
publicRouter.post("/comments", validate(commentCreateSchema), publicController.submitComment);
publicRouter.post("/contact", validate(contactCreateSchema), publicController.submitContact);

// Newsletter (public subscribe)
publicRouter.post("/newsletter", validate(newsletterCreateSchema), publicController.subscribeNewsletter);
