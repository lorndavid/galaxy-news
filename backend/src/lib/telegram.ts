import { env } from "../config/env";
import { logger } from "./logger";

// ============================================================
// Telegram Bot API client.
//   - Base URL is configurable (TELEGRAM_API_BASE) so tests can
//     point at a local mock; production default is the real API.
//   - The bot token is passed per-call by the caller (it lives in
//     the protected SiteSettings row, never in env or job payloads).
//   - All Telegram errors are mapped to clean, admin-friendly
//     messages. The token is never included in logs or errors.
// ============================================================

export interface TelegramBotInfo {
  id: number;
  username: string;
  name: string;
}

export interface TelegramChatInfo {
  id: number | string;
  title: string;
  type: string;
}

/** A chat the bot has interacted with — returned by getUpdates discovery. */
export interface TelegramDiscoveredChat {
  chatId: string;
  type: string; // private | group | supergroup | channel
  title: string;
  username: string | null;
}

export interface TelegramPhotoResult {
  messageId: number;
  chatId: string | number;
}

export class TelegramApiError extends Error {
  readonly code: string;
  /** Seconds Telegram asked us to wait (rate limiting) — used for backoff. */
  readonly retryAfterSec?: number;
  constructor(code: string, message: string, retryAfterSec?: number) {
    super(message);
    this.name = "TelegramApiError";
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

/** Hide all but the tail of a secret — used for admin display. */
export function maskSecret(secret: string | null | undefined, visible = 4): string {
  if (!secret) return "";
  if (secret.length <= visible + 3) return "***";
  return `${secret.slice(0, 4)}${"*".repeat(Math.max(4, secret.length - visible - 4))}${secret.slice(-visible)}`;
}

function botUrl(token: string, method: string): string {
  return `${env.telegram.apiBase.replace(/\/$/, "")}/bot${encodeURIComponent(token)}/${method}`;
}

interface TelegramErrorBody {
  ok: boolean;
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
}

function mapError(status: number, body: TelegramErrorBody, token: string): TelegramApiError {
  const code = body?.error_code ?? status;
  const desc = body?.description ?? "";
  if (code === 401) {
    return new TelegramApiError("INVALID_TOKEN", "Telegram bot token is invalid.");
  }
  if (code === 400) {
    if (/chat not found/i.test(desc)) {
      return new TelegramApiError("CHAT_NOT_FOUND", "Telegram chat could not be found.");
    }
    if (/caption/i.test(desc) || /message is too long/i.test(desc)) {
      return new TelegramApiError("CAPTION_TOO_LONG", "The Telegram message is too long.");
    }
    return new TelegramApiError("BAD_REQUEST", `Telegram rejected the request: ${desc || "bad request"}`);
  }
  if (code === 403) {
    return new TelegramApiError(
      "FORBIDDEN",
      "Telegram bot does not have permission to publish to this chat. Add the bot as an administrator of the channel/group."
    );
  }
  if (code === 404) {
    return new TelegramApiError("BOT_NOT_FOUND", "Telegram bot token is invalid.");
  }
  if (code === 429) {
    return new TelegramApiError(
      "RATE_LIMITED",
      "Telegram rate limit reached. The message will be retried.",
      body?.parameters?.retry_after
    );
  }
  // Never leak the token or raw upstream details into admin-visible errors.
  void token;
  return new TelegramApiError("TELEGRAM_ERROR", "Telegram is temporarily unavailable. Please try again later.");
}

async function callTelegram(
  token: string,
  method: string,
  init?: { form?: FormData; query?: URLSearchParams }
): Promise<Record<string, unknown>> {
  const url = new URL(botUrl(token, method));
  if (init?.query) url.search = init.query.toString();

  let res: Response;
  try {
    // FormData sets its own multipart Content-Type with boundary.
    res = await fetch(url.toString(), { method: "POST", body: init?.form });
  } catch (error) {
    logger.warn({ error, method }, "Telegram API network error");
    throw new TelegramApiError("NETWORK", "Could not reach Telegram. Check the server's internet connection.");
  }

  const bodyJson = (await res.json().catch(() => ({}))) as TelegramErrorBody & Record<string, unknown>;
  if (!res.ok || bodyJson.ok === false) {
    throw mapError(res.status, bodyJson, token);
  }
  return bodyJson;
}

/** Verify the bot token and return bot identity. */
export async function getMe(token: string): Promise<TelegramBotInfo> {
  const data = await callTelegram(token, "getMe");
  const result = data.result as { id: number; is_bot?: boolean; first_name?: string; username?: string } | undefined;
  if (!result || result.is_bot !== true) {
    throw new TelegramApiError("INVALID_TOKEN", "Telegram bot token is invalid.");
  }
  return {
    id: result.id,
    username: result.username ?? "",
    name: result.first_name ?? "",
  };
}

/**
 * Pull recent bot updates and collect the unique chats the bot has seen.
 * Used by the admin "discover chats" flow — e.g. personal chats of users
 * who pressed /start, groups/supergroups/channels where the bot was added.
 * Only reads (never confirms updates), so nothing is consumed here.
 */
export async function getUpdates(token: string, limit = 100): Promise<TelegramDiscoveredChat[]> {
  const data = await callTelegram(token, "getUpdates", {
    query: new URLSearchParams({ limit: String(limit), timeout: "1" }),
  });
  const updates = (data.result as Array<Record<string, unknown>> | undefined) ?? [];

  const seen = new Map<string, TelegramDiscoveredChat>();
  for (const u of updates) {
    // A chat can appear under message / channel_post / edited_message / my_chat_member / chat_member / etc.
    const chatRaw =
      (u.message as { chat?: Record<string, unknown> } | undefined)?.chat ??
      (u.channel_post as { chat?: Record<string, unknown> } | undefined)?.chat ??
      (u.my_chat_member as { chat?: Record<string, unknown> } | undefined)?.chat ??
      (u.chat_member as { chat?: Record<string, unknown> } | undefined)?.chat ??
      (u.chat_join_request as { chat?: Record<string, unknown> } | undefined)?.chat;
    if (!chatRaw || typeof chatRaw.id === "undefined") continue;

    // Real Telegram always provides the numeric chat id; keep that as the
    // canonical chatId (sendPhoto accepts it for every chat type) and store
    // the @username separately for display.
    const id = String(chatRaw.id);
    const username =
      typeof chatRaw.username === "string" && chatRaw.username ? `@${chatRaw.username}` : null;
    const title =
      typeof chatRaw.title === "string" && chatRaw.title
        ? chatRaw.title
        : (typeof chatRaw.first_name === "string" ? chatRaw.first_name : "") +
          (typeof chatRaw.last_name === "string" ? ` ${chatRaw.last_name}` : "");
    const type = typeof chatRaw.type === "string" ? chatRaw.type : "private";
    if (!seen.has(id)) {
      seen.set(id, {
        chatId: id,
        type,
        title: title || username || id,
        username,
      });
    }
  }
  return [...seen.values()];
}

/** Verify the chat is reachable by the bot and return its info. */
export async function getChat(token: string, chatId: string): Promise<TelegramChatInfo> {
  const data = await callTelegram(token, "getChat", {
    query: new URLSearchParams({ chat_id: chatId }),
  });
  const result = data.result as { id?: number; title?: string; type?: string; username?: string } | undefined;
  if (!result || !result.id) {
    throw new TelegramApiError("CHAT_NOT_FOUND", "Telegram chat ID is invalid or the bot cannot access this chat.");
  }
  return {
    id: result.id,
    title: result.title ?? result.username ?? String(result.id),
    type: result.type ?? "unknown",
  };
}

export interface SendPhotoInput {
  token: string;
  chatId: string;
  photo: Buffer;
  filename: string;
  mimeType: string;
  caption: string;
  parseMode: "HTML";
  replyMarkup?: { inline_keyboard: { text: string; url: string }[][] };
}

/** Send a photo with caption + inline keyboard (multipart upload, so the
 *  image never needs to be publicly reachable). */
export async function sendPhoto(input: SendPhotoInput): Promise<TelegramPhotoResult> {
  const form = new FormData();
  form.append(
    "chat_id",
    input.chatId,
  );
  form.append("photo", new Blob([new Uint8Array(input.photo)], { type: input.mimeType }), input.filename);
  form.append("caption", input.caption);
  form.append("parse_mode", input.parseMode);
  if (input.replyMarkup) {
    form.append("reply_markup", JSON.stringify(input.replyMarkup));
  }

  const data = await callTelegram(input.token, "sendPhoto", { form });
  const result = data.result as { message_id?: number; chat?: { id?: number } } | undefined;
  if (!result || !result.message_id) {
    throw new TelegramApiError("SEND_FAILED", "Telegram accepted the request but returned no message id.");
  }
  return { messageId: result.message_id, chatId: result.chat?.id ?? input.chatId };
}
