import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { ArticleStatus } from "../constants";
import { getR2Client, R2_BUCKET } from "../lib/r2";
import { prisma } from "../lib/prisma";
import {
  maskSecret,
  getMe,
  getChat,
  getUpdates,
  sendPhoto,
  TelegramApiError,
  type TelegramDiscoveredChat,
} from "../lib/telegram";
import { enqueueTelegramJob, type TelegramJob } from "../lib/telegramQueue";
import { ApiError } from "../utils/ApiError";
import { articleInclude } from "../utils/serialize";
import { logActivity } from "./activity.service";
import { logger } from "../lib/logger";

// ============================================================
// Telegram publishing service.
//
//   Admin saves settings   → validated via getMe + getChat first
//   Article published      → maybeAutoPublish() enqueues a job
//   Worker                 → processTelegramJob() sends the photo
//                            to EVERY enabled destination
//
// Destinations: a list of chats the bot publishes to — channels,
// supergroups, groups and private (personal) chats. Each has its own
// type + enabled flag and its own publication record per article.
//
// The bot token lives ONLY in the SiteSettings row and is never
// returned by any API (admin GET masks it), never logged, and
// never placed in queue payloads.
// ============================================================

const MAX_ATTEMPTS = 3;

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

// ------------------------------------------------------------------
// Destinations
// ------------------------------------------------------------------

export type TelegramDestinationType = "private" | "group" | "supergroup" | "channel";

export interface TelegramDestination {
  id: string;
  chatId: string; // @username or numeric id
  type: TelegramDestinationType;
  label: string; // display name (resolved from getChat)
  enabled: boolean;
}

export interface TelegramDestinationInput {
  id?: string;
  chatId: string;
  type?: TelegramDestinationType;
  label?: string;
  enabled?: boolean;
}

/** Guess a chat type from its id — refined by getChat on save. */
function guessType(chatId: string): TelegramDestinationType {
  const v = chatId.trim();
  if (v.startsWith("@")) return "channel";
  if (v.startsWith("-100")) return "supergroup";
  if (v.startsWith("-")) return "group";
  return "private";
}

const TYPE_LABEL: Record<string, string> = {
  private: "Personal",
  group: "Group",
  supergroup: "Supergroup",
  channel: "Channel",
};

/** Parse the stored destinations JSON, falling back to the legacy single chat. */
export function parseDestinations(raw: string | null | undefined, legacyChatId?: string | null): TelegramDestination[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as TelegramDestination[];
      if (Array.isArray(parsed)) {
        return parsed
          .filter((d) => d && typeof d.chatId === "string" && d.chatId.trim())
          .map((d) => ({
            id: d.id || randomUUID(),
            chatId: d.chatId.trim(),
            type: (d.type as TelegramDestinationType) || guessType(d.chatId),
            label: d.label || d.chatId,
            enabled: d.enabled !== false,
          }));
      }
    } catch {
      logger.warn("Failed to parse telegramDestinations JSON — ignoring");
    }
  }
  if (legacyChatId?.trim()) {
    const chatId = legacyChatId.trim();
    return [{ id: "legacy", chatId, type: guessType(chatId), label: chatId, enabled: true }];
  }
  return [];
}

// ------------------------------------------------------------------
// Settings
// ------------------------------------------------------------------

export interface TelegramSettingsView {
  botTokenMasked: string;
  chatIdMasked: string; // legacy single-chat mask (first enabled destination)
  destinations: TelegramDestination[];
  siteUrl: string;
  enabled: boolean;
  languageMode: "both" | "kh" | "en";
  buttonKh: string;
  buttonEn: string;
  connected: boolean;
}

async function settingsRow() {
  const row = await prisma.siteSettings.findFirst();
  if (row) return row;
  return prisma.siteSettings.create({ data: {} });
}

export async function getTelegramSettings(): Promise<TelegramSettingsView> {
  const s = await settingsRow();
  const destinations = parseDestinations(s.telegramDestinations, s.telegramChatId);
  return {
    botTokenMasked: maskSecret(s.telegramBotToken),
    chatIdMasked: maskSecret(destinations[0]?.chatId),
    destinations,
    siteUrl: s.telegramSiteUrl || env.publicSiteUrl,
    enabled: s.telegramEnabled,
    languageMode: (s.telegramLanguageMode as "both" | "kh" | "en") ?? "both",
    buttonKh: s.telegramButtonKh,
    buttonEn: s.telegramButtonEn,
    connected: Boolean(s.telegramBotToken && destinations.some((d) => d.enabled)),
  };
}

export interface TelegramTestResult {
  success: boolean;
  message: string;
  bot?: { username: string; name: string };
  chats?: { chatId: string; title: string; type: string }[];
  chat?: { title: string; type: string }; // legacy single-chat field
  warning?: string;
}

/** Validate a token format client-side before hitting the API. */
function validateTokenFormat(token: string): void {
  if (!/^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(token.trim())) {
    throw ApiError.badRequest("Telegram bot token format is invalid. Get a token from @BotFather.");
  }
}

function validateChatId(chatId: string): void {
  const v = chatId.trim();
  // @username channels or numeric ids (including negative group/channel ids).
  if (!/^@?[A-Za-z0-9_]{3,}$/.test(v) && !/^-?\d{5,}$/.test(v)) {
    throw ApiError.badRequest("Telegram chat ID looks invalid. Use a channel @username or numeric chat id.");
  }
}

/** Validate an http(s) button-link URL; reject unsafe protocols. */
function validateSiteUrl(url: string): string | null {
  const v = url.trim();
  if (!/^https?:\/\//i.test(v)) {
    return "Site URL must start with http:// or https:// (button links need a public URL).";
  }
  try {
    const parsed = new URL(v);
    if (!parsed.hostname) return "Site URL is invalid.";
    // Warn (not block) on local/private hosts — Telegram rejects button
    // links pointing at localhost, so a public domain is required in prod.
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) {
      return null;
    }
  } catch {
    return "Site URL is invalid.";
  }
  return null;
}

/**
 * Verify the bot token and every chat by calling the Telegram API. Throws a
 * clean ApiError with an admin-friendly message when any check fails.
 */
export async function verifyConnection(
  token: string,
  chats: string[]
): Promise<TelegramTestResult> {
  validateTokenFormat(token);
  if (!chats.length) throw ApiError.badRequest("At least one chat destination is required.");
  for (const c of chats) validateChatId(c);

  let bot;
  try {
    bot = await getMe(token.trim());
  } catch (error) {
    if (error instanceof TelegramApiError) throw ApiError.badRequest(error.message);
    throw error;
  }

  const chatResults: { chatId: string; title: string; type: string }[] = [];
  for (const chatId of chats) {
    try {
      const chat = await getChat(token.trim(), chatId.trim());
      chatResults.push({ chatId: chatId.trim(), title: chat.title, type: chat.type });
    } catch (error) {
      if (error instanceof TelegramApiError) throw ApiError.badRequest(error.message);
      throw error;
    }
  }

  const result: TelegramTestResult = {
    success: true,
    message: "Telegram connection successful",
    bot: { username: bot.username ? `@${bot.username}` : "", name: bot.name },
    chats: chatResults,
    // Legacy single-chat view (first destination) for older clients.
    chat: chatResults[0] ? { title: chatResults[0].title, type: chatResults[0].type } : undefined,
  };
  return result;
}

/**
 * Save & test: verify the connection FIRST, and only persist the new
 * credentials when getMe and every getChat pass. Invalid credentials are
 * never saved.
 */
export async function saveTelegramSettings(
  input: {
    botToken?: string;
    destinations?: TelegramDestinationInput[];
    siteUrl?: string;
    enabled?: boolean;
    languageMode?: "both" | "kh" | "en";
    buttonKh?: string;
    buttonEn?: string;
  },
  userId: number,
  ip?: string | null
): Promise<{ settings: TelegramSettingsView; test: TelegramTestResult }> {
  const current = await settingsRow();
  const token = input.botToken?.trim() || current.telegramBotToken || "";
  const currentDestinations = parseDestinations(current.telegramDestinations, current.telegramChatId);
  const incoming = input.destinations?.length
    ? input.destinations.map((d) => ({
        id: d.id || randomUUID(),
        chatId: d.chatId.trim(),
        type: (d.type as TelegramDestinationType) || guessType(d.chatId),
        label: d.label?.trim() || d.chatId.trim(),
        enabled: d.enabled !== false,
      }))
    : currentDestinations;

  if (!token) throw ApiError.badRequest("Bot token is required to connect.");
  if (!incoming.length) throw ApiError.badRequest("At least one chat destination is required to connect.");

  const test = await verifyConnection(token, incoming.map((d) => d.chatId));

  // Site URL check (warn, don't block — local dev stacks still need to save).
  let warning: string | undefined;
  if (input.siteUrl !== undefined) {
    const err = validateSiteUrl(input.siteUrl);
    if (err) throw ApiError.badRequest(err);
    const host = new URL(input.siteUrl.trim()).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) {
      warning = "Site URL is a local address. Inline button links will not work in Telegram — the article URL will be shown as plain text in the caption instead. For clickable buttons, set a public domain (e.g. https://yourdomain.com) or use ngrok/cloudflare tunnel.";
    }
  }
  if (test.warning || warning) test.warning = test.warning ?? warning;

  // Merge verified chat metadata (title/type) back into the saved destinations.
  const verified: TelegramDestination[] = incoming.map((d) => {
    const info = test.chats?.find((c) => c.chatId === d.chatId);
    return {
      ...d,
      label: info?.title || d.label || d.chatId,
      type: (info?.type as TelegramDestinationType) || d.type,
    };
  });

  const data: Record<string, unknown> = {};
  if (input.botToken !== undefined) data.telegramBotToken = input.botToken.trim();
  if (input.destinations !== undefined) {
    data.telegramDestinations = JSON.stringify(verified);
    // Keep the legacy column in sync with the first destination.
    data.telegramChatId = verified[0]?.chatId ?? null;
  }
  if (input.siteUrl !== undefined) data.telegramSiteUrl = input.siteUrl.trim();
  if (input.enabled !== undefined) data.telegramEnabled = input.enabled;
  if (input.languageMode !== undefined) data.telegramLanguageMode = input.languageMode;
  if (input.buttonKh !== undefined) data.telegramButtonKh = input.buttonKh.trim();
  if (input.buttonEn !== undefined) data.telegramButtonEn = input.buttonEn.trim();

  await prisma.siteSettings.update({ where: { id: current.id }, data });
  await logActivity({
    userId,
    action: "TELEGRAM_SETTINGS_UPDATED",
    entity: "SiteSettings",
    entityId: current.id,
    meta: { enabled: data.telegramEnabled, destinationCount: verified.length },
    ip,
  });

  return { settings: await getTelegramSettings(), test };
}

/** Test the connection WITHOUT saving anything (uses provided or stored values). */
export async function testTelegramConnection(input: {
  botToken?: string;
  destinations?: TelegramDestinationInput[];
}): Promise<TelegramTestResult> {
  const current = await settingsRow();
  const token = input.botToken?.trim() || current.telegramBotToken || "";
  const currentDestinations = parseDestinations(current.telegramDestinations, current.telegramChatId);
  const chats = input.destinations?.length
    ? input.destinations.map((d) => d.chatId.trim())
    : currentDestinations.map((d) => d.chatId);
  if (!token || !chats.length) {
    throw ApiError.badRequest("Bot token and at least one chat destination are required to test the connection.");
  }
  return verifyConnection(token, chats);
}

/**
 * Discover chats the bot has seen (users who pressed /start, groups and
 * channels where it was added) via getUpdates — read-only, never saves.
 */
export async function discoverChats(): Promise<TelegramDiscoveredChat[]> {
  const current = await settingsRow();
  if (!current.telegramBotToken) {
    throw ApiError.badRequest("Save a bot token first — discovery needs the bot's updates.");
  }
  try {
    return await getUpdates(current.telegramBotToken);
  } catch (error) {
    if (error instanceof TelegramApiError) throw ApiError.badRequest(error.message);
    throw error;
  }
}

// ------------------------------------------------------------------
// Publications
// ------------------------------------------------------------------

export interface TelegramPublicationView {
  id: number;
  articleId: number;
  status: string;
  telegramMessageId: number | null;
  chatId: string | null;
  languageMode: string;
  attempts: number;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function serializePublication(p: {
  id: number;
  articleId: number;
  status: string;
  telegramMessageId: number | null;
  chatId: string | null;
  languageMode: string;
  attempts: number;
  errorMessage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TelegramPublicationView {
  return {
    id: p.id,
    articleId: p.articleId,
    status: p.status,
    telegramMessageId: p.telegramMessageId,
    chatId: p.chatId,
    languageMode: p.languageMode,
    attempts: p.attempts,
    errorMessage: p.errorMessage,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getPublication(articleId: number): Promise<TelegramPublicationView[]> {
  const pubs = await prisma.telegramPublication.findMany({
    where: { articleId },
    orderBy: { id: "asc" },
  });
  return pubs.map(serializePublication);
}

export async function telegramStats(): Promise<{ published: number; pending: number; processing: number; failed: number }> {
  const rows = await prisma.telegramPublication.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const count = (status: string) => rows.find((r) => r.status === status)?._count._all ?? 0;
  return {
    published: count("PUBLISHED"),
    pending: count("PENDING"),
    processing: count("PROCESSING"),
    failed: count("FAILED"),
  };
}

/**
 * Manual send / retry. Duplicate protection: if ANY destination is already
 * PUBLISHED (or in flight), the send is rejected unless `force` is set (the
 * "Send Again" flow with explicit confirmation). Force resets every record
 * so the worker re-publishes to all enabled destinations.
 */
export async function sendToTelegram(
  articleId: number,
  opts: { force?: boolean; userId?: number; ip?: string | null } = {}
): Promise<TelegramPublicationView[]> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw ApiError.notFound("Article not found");

  const s = await settingsRow();
  const destinations = parseDestinations(s.telegramDestinations, s.telegramChatId).filter((d) => d.enabled);
  if (!s.telegramBotToken || !destinations.length) {
    throw ApiError.badRequest("Telegram is not configured. Add the bot token and at least one chat destination in Settings → Integrations → Telegram.");
  }

  const existing = await prisma.telegramPublication.findMany({ where: { articleId } });
  if (!opts.force && existing.length) {
    if (existing.some((p) => p.status === "PUBLISHED")) {
      throw ApiError.conflict("This article is already published to Telegram.");
    }
    if (existing.some((p) => p.status === "PENDING" || p.status === "PROCESSING")) {
      throw ApiError.conflict("A Telegram publication is already in progress for this article.");
    }
  }

  // Force resend resets the records so the worker can send again.
  if (opts.force && existing.length) {
    await prisma.telegramPublication.deleteMany({ where: { articleId } });
  }

  await enqueueTelegramJob(articleId);
  await logActivity({
    userId: opts.userId ?? null,
    action: "TELEGRAM_SEND_QUEUED",
    entity: "Article",
    entityId: articleId,
    meta: { force: Boolean(opts.force), destinations: destinations.length },
    ip: opts.ip ?? null,
  });

  // Return placeholder rows (PENDING) for each destination so the UI can
  // show what is about to be sent; the worker owns the real records.
  const now = new Date();
  return destinations.map((d) =>
    serializePublication({
      id: 0,
      articleId,
      status: "PENDING",
      telegramMessageId: null,
      chatId: d.chatId,
      languageMode: s.telegramLanguageMode ?? "both",
      attempts: 0,
      errorMessage: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  );
}

/**
 * Auto-publish hook — called by the article service whenever an article
 * becomes PUBLISHED. Only enqueues when auto-publish is enabled and at
 * least one destination exists. Never throws: article publishing must not
 * break.
 */
export async function maybeAutoPublish(articleId: number): Promise<void> {
  try {
    const s = await settingsRow();
    const destinations = parseDestinations(s.telegramDestinations, s.telegramChatId).filter((d) => d.enabled);
    if (!s.telegramEnabled || !s.telegramBotToken || !destinations.length) return;

    const existing = await prisma.telegramPublication.findMany({ where: { articleId } });
    if (existing.some((p) => p.status === "PUBLISHED" || p.status === "PROCESSING")) return;
    // A stuck/failed PENDING older than 5 minutes may be retried; a fresh
    // PENDING is already in flight.
    if (existing.some((p) => p.status === "PENDING" && p.updatedAt > new Date(Date.now() - 5 * 60_000))) return;

    await enqueueTelegramJob(articleId);
    logger.info({ articleId }, "Telegram auto-publish job queued");
  } catch (error) {
    // Never break article publishing because of Telegram bookkeeping.
    logger.error({ error, articleId }, "Telegram auto-publish hook failed (article unaffected)");
  }
}

// ------------------------------------------------------------------
// Job processing (worker)
// ------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Check whether a URL is publicly routable.
 * Telegram rejects inline keyboard buttons that point at localhost
 * or private IP ranges, so callers must skip the button in those cases
 * and fall back to a plain-text link in the caption.
 */
function isPublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}

function buildCaption(article: ArticleWithRelations, articleUrl?: string): string {
  const title = escapeHtml(article.title || "Untitled");
  const excerpt = escapeHtml((article.excerpt ?? "").trim()).slice(0, 300);
  let caption = excerpt ? `<b>${title}</b>\n\n${excerpt}` : `<b>${title}</b>`;
  // When there is no inline button (local / private URL) include the
  // article link as plain text so users can still see where to visit.
  if (articleUrl) {
    caption += `\n\n🔗 ${articleUrl}`;
  }
  // Telegram caption limit is 1024 chars — trim without breaking HTML.
  return caption.length <= 1024 ? caption : `${caption.slice(0, 1000)}…`;
}

function buildKeyboard(
  article: ArticleWithRelations,
  settings: { telegramLanguageMode: string | null; telegramButtonKh: string; telegramButtonEn: string; telegramSiteUrl: string | null }
): { text: string; url: string }[][] | null {
  const base = (settings.telegramSiteUrl || env.publicSiteUrl).replace(/\/$/, "");
  const slug = article.slug;

  // Telegram rejects inline keyboard buttons whose URLs point at localhost
  // or private IPs.  When that is the case we skip the keyboard entirely
  // and include the URL as plain text in the caption instead.
  if (!isPublicUrl(base)) {
    return null;
  }

  const hasEn = Boolean(article.titleEn?.trim() || article.contentEn?.trim());
  const mode = (settings.telegramLanguageMode as "both" | "kh" | "en" | null) ?? "both";
  const kh = { text: settings.telegramButtonKh || "🇰🇭 អានជាភាសាខ្មែរ", url: `${base}/kh/news/${slug}` };
  const en = { text: settings.telegramButtonEn || "🇬🇧 Read in English", url: `${base}/en/news/${slug}` };

  // One row, side by side (matches the standard bilingual layout).
  // Never send a broken button: English-only mode falls back to Khmer
  // when the English translation is missing.
  if (mode === "kh") return [[kh]];
  if (mode === "en") return hasEn ? [[en]] : [[kh]];
  return hasEn ? [[kh, en]] : [[kh]];
}

function mimeFor(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

async function collectStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Load the article's featured image bytes without touching arbitrary URLs:
 * only MinIO objects (extracted from the stored URL) or local /uploads
 * files are read — no SSRF surface.
 */
async function loadArticleImage(
  article: ArticleWithRelations
): Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> {
  const url = article.featuredImage;
  if (!url) return null;

  let objectKey: string | null = null;
  // R2 URLs: extract the object key from the public URL or R2.dev URL.
  //   https://media.galaxytv4k.online/articles/xxx.jpg  (custom domain)
  //   https://news-media.xxx.r2.dev/articles/xxx.jpg   (R2.dev default)
  const r2PublicUrl = env.r2.publicUrl;
  if (r2PublicUrl && url.startsWith(r2PublicUrl)) {
    objectKey = decodeURIComponent(url.slice(r2PublicUrl.length + 1).split("?")[0]);
  } else {
    const marker = "/news-media/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      objectKey = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    }
  }

  if (objectKey) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = getR2Client();
    if (!client) return null;
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: objectKey }));
      const stream = response.Body as NodeJS.ReadableStream;
      const buffer = await collectStream(stream);
      return { buffer, filename: objectKey.split("/").pop() ?? "image", mimeType: mimeFor(objectKey) };
    } catch (error) {
      logger.warn({ error, objectKey }, "Failed to load article image from R2");
      return null;
    }
  }

  if (url.startsWith("/uploads/")) {
    try {
      const file = path.join(env.uploadsDir, path.basename(url));
      const buffer = fs.readFileSync(file);
      return { buffer, filename: path.basename(url), mimeType: mimeFor(url) };
    } catch (error) {
      logger.warn({ error, url }, "Failed to load article image from disk");
      return null;
    }
  }

  return null;
}

/** Send one article to one destination with retry/backoff. */
async function publishToDestination(
  article: ArticleWithRelations,
  s: {
    telegramBotToken: string;
    telegramLanguageMode: string | null;
    telegramButtonKh: string;
    telegramButtonEn: string;
    telegramSiteUrl: string | null;
  },
  destination: TelegramDestination
): Promise<void> {
  const existing = await prisma.telegramPublication.findUnique({
    where: { articleId_chatId: { articleId: article.id, chatId: destination.chatId } },
  });

  // Duplicate protection: a successful send to this chat is never repeated.
  if (existing?.status === "PUBLISHED") {
    logger.info({ articleId: article.id, chatId: destination.chatId }, "Telegram job: already published to this chat — skipped");
    return;
  }
  // Respect scheduled backoff from a previous failed attempt.
  if (existing?.status === "PENDING" && existing.nextAttemptAt && existing.nextAttemptAt > new Date()) {
    await sleep(existing.nextAttemptAt.getTime() - Date.now());
    return; // the re-enqueued job will handle it after the backoff
  }

  const record = await prisma.telegramPublication.upsert({
    where: { articleId_chatId: { articleId: article.id, chatId: destination.chatId } },
    create: {
      articleId: article.id,
      chatId: destination.chatId,
      status: "PROCESSING",
      attempts: 1,
      languageMode: s.telegramLanguageMode ?? "both",
    },
    update: { status: "PROCESSING", attempts: { increment: 1 }, errorMessage: null, updatedAt: new Date() },
  });

  try {
    const image = await loadArticleImage(article);
    if (!image) {
      throw new TelegramApiError(
        "IMAGE_UNAVAILABLE",
        "Telegram could not access the article image. Upload a featured image and try again."
      );
    }

    const base = (s.telegramSiteUrl || env.publicSiteUrl).replace(/\/$/, "");
    const slug = article.slug;
    const articleUrl = `${base}/kh/news/${slug}`;
    const keyboard = buildKeyboard(article, s);
    // When the site URL is local/private Telegram rejects inline buttons,
    // so we send the photo with a plain-text URL in the caption instead.
    const caption = buildCaption(article, keyboard ? undefined : articleUrl);
    const result = await sendPhoto({
      token: s.telegramBotToken,
      chatId: destination.chatId,
      photo: image.buffer,
      filename: image.filename,
      mimeType: image.mimeType,
      caption,
      parseMode: "HTML",
      replyMarkup: keyboard ? { inline_keyboard: keyboard } : undefined,
    });

    await prisma.telegramPublication.update({
      where: { id: record.id },
      data: {
        status: "PUBLISHED",
        telegramMessageId: result.messageId,
        chatId: String(result.chatId),
        languageMode: s.telegramLanguageMode ?? "both",
        errorMessage: null,
        publishedAt: new Date(),
        nextAttemptAt: null,
      },
    });
    await logActivity({
      userId: null,
      action: "TELEGRAM_PUBLISHED",
      entity: "Article",
      entityId: article.id,
      meta: { messageId: result.messageId, chatId: destination.chatId },
    });
    logger.info({ articleId: article.id, chatId: destination.chatId, messageId: result.messageId }, "Telegram publication succeeded");
  } catch (error) {
    const message = error instanceof TelegramApiError ? error.message : "Telegram publishing failed unexpectedly. Please try again.";
    const attempts = record.attempts;
    if (attempts < MAX_ATTEMPTS) {
      const delaySec = error instanceof TelegramApiError ? error.retryAfterSec ?? attempts * 15 : attempts * 15;
      await prisma.telegramPublication.update({
        where: { id: record.id },
        data: {
          status: "PENDING",
          errorMessage: message,
          nextAttemptAt: new Date(Date.now() + delaySec * 1000),
        },
      });
      logger.warn({ articleId: article.id, chatId: destination.chatId, attempts, delaySec }, "Telegram attempt failed — will retry");
      await enqueueTelegramJob(article.id);
    } else {
      await prisma.telegramPublication.update({
        where: { id: record.id },
        data: { status: "FAILED", errorMessage: message, nextAttemptAt: null },
      });
      await logActivity({
        userId: null,
        action: "TELEGRAM_FAILED",
        entity: "Article",
        entityId: article.id,
        meta: { attempts, message, chatId: destination.chatId },
      });
      logger.error({ articleId: article.id, chatId: destination.chatId, attempts, message }, "Telegram publication failed permanently");
    }
  }
}

/** Core worker step: send one article to every enabled destination. */
export async function processTelegramJob(job: TelegramJob): Promise<void> {
  const article = await prisma.article.findUnique({
    where: { id: job.articleId },
    include: articleInclude,
  });
  if (!article) {
    logger.warn({ articleId: job.articleId }, "Telegram job: article no longer exists");
    return;
  }
  // Only published articles are ever sent (drafts/scheduled/archived never).
  if (article.status !== ArticleStatus.PUBLISHED) {
    logger.info({ articleId: article.id, status: article.status }, "Telegram job: article not published — skipped");
    return;
  }

  const s = await settingsRow();
  const destinations = parseDestinations(s.telegramDestinations, s.telegramChatId).filter((d) => d.enabled);
  if (!s.telegramBotToken || !destinations.length) {
    await prisma.telegramPublication.deleteMany({
      where: { articleId: article.id, status: { in: ["PENDING", "PROCESSING"] } },
    });
    await prisma.telegramPublication.create({
      data: {
        articleId: article.id,
        chatId: "unconfigured",
        status: "FAILED",
        attempts: 0,
        errorMessage: "Telegram is not configured. Add a bot token and at least one chat destination in Settings → Integrations → Telegram.",
      },
    });
    return;
  }

  for (const destination of destinations) {
    await publishToDestination(article, s as typeof s & { telegramBotToken: string }, destination);
  }
}

export { TYPE_LABEL };
