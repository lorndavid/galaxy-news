import { API_URL } from "../playwright.config";

/**
 * Fails fast with a helpful message when the stack isn't running, instead
 * of a wall of selector timeouts. Just checks that the backend health
 * endpoint responds with a healthy database.
 */
export default async function globalSetup() {
  let healthy = false;
  let detail = "";
  try {
    const res = await fetch(`${API_URL}/health`);
    const json = (await res.json()) as {
      data?: { dependencies?: Record<string, string> };
    };
    const deps = json.data?.dependencies;
    healthy = deps?.database === "ok";
    detail = JSON.stringify(deps ?? {});
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
  }

  if (!healthy) {
    throw new Error(
      [
        `E2E stack is not healthy.`,
        `  API: ${API_URL} → ${detail}`,
        ``,
        `Start the stack first:`,
        `  docker compose up -d --build`,
        ``,
        `Or override the URLs:`,
        `  E2E_API_URL=... E2E_ADMIN_URL=... E2E_PUBLIC_URL=... npm run test:e2e`,
      ].join("\n")
    );
  }
}
