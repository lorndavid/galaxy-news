import { Router } from "express";
import * as articleController from "../controllers/article.controller";
import * as publicController from "../controllers/public.controller";
import { ttlCache } from "../middleware/cache";
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
