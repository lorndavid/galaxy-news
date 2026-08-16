import { Router } from "express";
import { authenticate, requireAdmin, requireEditor } from "../middleware/auth";
import { clearPublicCache } from "../middleware/cache";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import * as articleController from "../controllers/admin.article.controller";
import * as contentController from "../controllers/admin.content.controller";
import * as mediaController from "../controllers/admin.media.controller";
import * as userController from "../controllers/admin.user.controller";
import * as moderationController from "../controllers/admin.moderation.controller";
import * as systemController from "../controllers/admin.system.controller";
import { adminArticleListQuery, articleCreateSchema, articleParamsSchema, articleUpdateSchema } from "../validators/article.validator";
import { categoryCreateSchema, categoryReorderSchema, categoryUpdateSchema, commentListQuery, commentStatusSchema, idParamsSchema, newsletterListQuery, tagCreateSchema, tagUpdateSchema, adCreateSchema, adUpdateSchema } from "../validators/content.validator";
import { userCreateSchema, userListQuery, userUpdateSchema } from "../validators/user.validator";
import { settingsUpdateSchema } from "../validators/settings.validator";

export const adminRouter = Router();

adminRouter.use(authenticate);

// Any mutation through the admin API invalidates the public feed cache so
// published content appears on the website immediately.
adminRouter.use((req, _res, next) => {
  if (req.method !== "GET") clearPublicCache();
  next();
});

// ---- Dashboard / system ----
adminRouter.get("/stats", systemController.stats);
adminRouter.get("/activity", requireAdmin, systemController.activityLogs);
adminRouter.get("/settings", requireAdmin, systemController.getSettings);
adminRouter.put("/settings", requireAdmin, validate(settingsUpdateSchema), systemController.updateSettings);

// ---- Articles ----
adminRouter.get("/articles", validate(adminArticleListQuery), articleController.list);
adminRouter.get("/articles/:id", validate(articleParamsSchema), articleController.get);
adminRouter.post("/articles", validate(articleCreateSchema), articleController.create);
adminRouter.patch("/articles/:id", validate(articleParamsSchema), validate(articleUpdateSchema), articleController.update);
adminRouter.delete("/articles/:id", validate(articleParamsSchema), articleController.remove);

// ---- Categories ----
adminRouter.get("/categories", contentController.listCategories);
adminRouter.post("/categories", requireEditor, validate(categoryCreateSchema), contentController.createCategory);
adminRouter.patch("/categories/:id", requireEditor, validate(idParamsSchema), validate(categoryUpdateSchema), contentController.updateCategory);
adminRouter.delete("/categories/:id", requireEditor, validate(idParamsSchema), contentController.deleteCategory);
adminRouter.post("/categories/reorder", requireEditor, validate(categoryReorderSchema), contentController.reorderCategories);

// ---- Tags ----
adminRouter.get("/tags", contentController.listTags);
adminRouter.post("/tags", requireEditor, validate(tagCreateSchema), contentController.createTag);
adminRouter.patch("/tags/:id", requireEditor, validate(idParamsSchema), validate(tagUpdateSchema), contentController.updateTag);
adminRouter.delete("/tags/:id", requireEditor, validate(idParamsSchema), contentController.deleteTag);

// ---- Media ----
adminRouter.get("/media", mediaController.list);
adminRouter.post("/media/upload", requireEditor, upload("file"), mediaController.upload);
adminRouter.delete("/media/:id", requireEditor, validate(idParamsSchema), mediaController.remove);

// ---- Users ----
adminRouter.get("/users", requireAdmin, validate(userListQuery), userController.list);
adminRouter.post("/users", requireAdmin, validate(userCreateSchema), userController.create);
adminRouter.patch("/users/:id", requireAdmin, validate(idParamsSchema), validate(userUpdateSchema), userController.update);
adminRouter.delete("/users/:id", requireAdmin, validate(idParamsSchema), userController.remove);

// ---- Comments ----
adminRouter.get("/comments", requireEditor, validate(commentListQuery), moderationController.listComments);
adminRouter.patch("/comments/:id", requireEditor, validate(idParamsSchema), validate(commentStatusSchema), moderationController.moderateComment);
adminRouter.delete("/comments/:id", requireEditor, validate(idParamsSchema), moderationController.deleteComment);

// ---- Contact messages ----
adminRouter.get("/messages", requireAdmin, validate(commentListQuery), moderationController.listMessages);
adminRouter.delete("/messages/:id", requireAdmin, validate(idParamsSchema), moderationController.deleteMessage);

// ---- Newsletter subscribers ----
adminRouter.get("/newsletter", requireAdmin, validate(newsletterListQuery), moderationController.listSubscribers);
adminRouter.delete("/newsletter/:id", requireAdmin, validate(idParamsSchema), moderationController.deleteSubscriber);

// ---- Advertisements ----
adminRouter.get("/ads", contentController.listAds);
adminRouter.post("/ads", requireEditor, validate(adCreateSchema), contentController.createAd);
adminRouter.patch("/ads/:id", requireEditor, validate(idParamsSchema), validate(adUpdateSchema), contentController.updateAd);
adminRouter.delete("/ads/:id", requireEditor, validate(idParamsSchema), contentController.deleteAd);
