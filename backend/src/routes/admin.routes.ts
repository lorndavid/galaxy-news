import { Router } from "express";
import { authenticate, requireAdmin, requireEditor } from "../middleware/auth";
import { invalidateAdminMutation } from "../middleware/cache";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import * as articleController from "../controllers/admin.article.controller";
import * as contentController from "../controllers/admin.content.controller";
import * as mediaController from "../controllers/admin.media.controller";
import * as userController from "../controllers/admin.user.controller";
import * as moderationController from "../controllers/admin.moderation.controller";
import * as systemController from "../controllers/admin.system.controller";
import * as builderController from "../controllers/admin.builder.controller";
import * as telegramController from "../controllers/admin.telegram.controller";
import { adminArticleListQuery, articleBulkSchema, articleCreateSchema, articleParamsSchema, articleUpdateSchema } from "../validators/article.validator";
import { homepageReorderSchema, homepageSectionsUpdateSchema, navCreateSchema, navReorderSchema, navUpdateSchema } from "../validators/homepage.validator";
import { categoryCreateSchema, categoryReorderSchema, categoryUpdateSchema, commentListQuery, commentStatusSchema, idParamsSchema, mediaBulkSchema, newsletterListQuery, tagCreateSchema, tagUpdateSchema, adCreateSchema, adUpdateSchema } from "../validators/content.validator";
import { userCreateSchema, userListQuery, userUpdateSchema } from "../validators/user.validator";
import { settingsUpdateSchema } from "../validators/settings.validator";
import { telegramSendSchema, telegramSettingsUpdateSchema, telegramTestSchema } from "../validators/telegram.validator";
import * as liveStreamController from "../controllers/admin.livestream.controller";
import { liveStreamCreateSchema, liveStreamUpdateSchema, liveStreamStatusSchema, liveStreamHomepageSchema } from "../validators/livestream.validator";

export const adminRouter = Router();

adminRouter.use(authenticate);

// Any mutation through the admin API invalidates only the public feeds it
// can affect (breaking / featured / category / article detail / settings / …)
// so published content appears on the website immediately. The invalidation
// is awaited so a GET right after the mutation response can never read the
// pre-mutation cache.
adminRouter.use(async (req, res, next) => {
  if (req.method !== "GET") {
    try {
      // Invalidate BEFORE the mutation: reads pre-mutation rows (old slugs,
      // old category) so renames/unpublishes clear the right public feeds.
      await invalidateAdminMutation(req);
      // Invalidate again AFTER the response completes: any GET that read the
      // pre-mutation database state during the handler's write window gets
      // its stale cache entry dropped by the bumped generation.
      res.on("finish", () => {
        void invalidateAdminMutation(req);
      });
    } finally {
      next();
    }
    return;
  }
  next();
});

// ---- Dashboard / system ----
adminRouter.get("/stats", systemController.stats);
adminRouter.get("/activity", requireAdmin, systemController.activityLogs);
adminRouter.get("/settings", requireAdmin, systemController.getSettings);
adminRouter.put("/settings", requireAdmin, validate(settingsUpdateSchema), systemController.updateSettings);

// ---- Homepage builder ----
adminRouter.get("/homepage/sections", requireEditor, builderController.listSections);
adminRouter.put("/homepage/sections", requireEditor, validate(homepageSectionsUpdateSchema), builderController.updateSections);
adminRouter.post("/homepage/sections/reorder", requireEditor, validate(homepageReorderSchema), builderController.reorderSections);

// ---- Navigation builder ----
adminRouter.get("/navigation", requireEditor, builderController.listNav);
adminRouter.post("/navigation", requireEditor, validate(navCreateSchema), builderController.createNav);
adminRouter.patch("/navigation/:id", requireEditor, validate(idParamsSchema), validate(navUpdateSchema), builderController.updateNav);
adminRouter.post("/navigation/reorder", requireEditor, validate(navReorderSchema), builderController.reorderNav);
adminRouter.delete("/navigation/:id", requireEditor, validate(idParamsSchema), builderController.deleteNav);

// ---- Articles ----
adminRouter.get("/articles", validate(adminArticleListQuery), articleController.list);
adminRouter.post("/articles", validate(articleCreateSchema), articleController.create);
adminRouter.post("/articles/bulk", validate(articleBulkSchema), articleController.bulk);
adminRouter.get("/articles/:id", validate(articleParamsSchema), articleController.get);
adminRouter.patch("/articles/:id", validate(articleParamsSchema), validate(articleUpdateSchema), articleController.update);
adminRouter.delete("/articles/:id", validate(articleParamsSchema), articleController.remove);

// ---- Article Gallery Images ----
adminRouter.get("/articles/:id/images", validate(articleParamsSchema), articleController.getImages);
adminRouter.post("/articles/:id/images", validate(articleParamsSchema), articleController.addImage);
adminRouter.patch("/articles/:articleId/images/:imageId", articleController.updateImage);
adminRouter.delete("/articles/:articleId/images/:imageId", articleController.removeImage);

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
adminRouter.post("/media/bulk", requireEditor, validate(mediaBulkSchema), mediaController.bulk);
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

// ---- Live Streams ----
adminRouter.get("/live-streams", liveStreamController.list);
adminRouter.get("/live-streams/:id", validate(idParamsSchema), liveStreamController.get);
adminRouter.post("/live-streams", validate(liveStreamCreateSchema), liveStreamController.create);
adminRouter.patch("/live-streams/:id", validate(idParamsSchema), validate(liveStreamUpdateSchema), liveStreamController.update);
adminRouter.delete("/live-streams/:id", validate(idParamsSchema), liveStreamController.remove);
adminRouter.patch("/live-streams/:id/status", validate(idParamsSchema), validate(liveStreamStatusSchema), liveStreamController.updateStatus);
adminRouter.patch("/live-streams/:id/homepage", validate(idParamsSchema), validate(liveStreamHomepageSchema), liveStreamController.updateHomepage);

// ---- Telegram integration ----
adminRouter.get("/settings/telegram", requireAdmin, telegramController.getSettings);
adminRouter.put("/settings/telegram", requireAdmin, validate(telegramSettingsUpdateSchema), telegramController.saveSettings);
adminRouter.post("/settings/telegram/test", requireAdmin, validate(telegramTestSchema), telegramController.testConnection);
adminRouter.post("/settings/telegram/discover", requireAdmin, telegramController.discover);
adminRouter.get("/telegram/stats", requireAdmin, telegramController.stats);
adminRouter.get("/articles/:id/telegram", requireEditor, validate(articleParamsSchema), telegramController.getPublication);
adminRouter.post("/articles/:id/telegram/send", requireEditor, validate(articleParamsSchema), validate(telegramSendSchema), telegramController.send);
